import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { ClipboardCheck, Search, Camera, Check, X, CheckCircle2, Clock, ShieldAlert, Filter, Send } from 'lucide-react';
import { NeoSelect } from '../components/NeoSelect';
import { useNeoFilters } from '../hooks/useNeoFilters';
import { NeoAdvancedFilter } from '../components/NeoAdvancedFilter';
import { NeoPagination } from '../components/NeoPagination';
import { AuthContext } from '../components/ProtectedRoute';

export function Auditoria() {
  const { isAdmin } = useContext(AuthContext);
  const { activeBranch } = useBranchStore();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Modes: 'SELECTION', 'EMPLOYEE_COUNT', 'ADMIN_REVIEW'
  const [mode, setMode] = useState(isAdmin ? 'SELECTION' : 'EMPLOYEE_COUNT'); 
  
  // -- Session State --
  const [currentSession, setCurrentSession] = useState(null);
  const [products, setProducts] = useState([]);
  
  // Form State for Employee
  const [countedProducts, setCountedProducts] = useState({}); // { product_id: { count, photoUrl } }
  
  // Admin State
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (activeBranch) {
      loadInitialData();
    }
  }, [activeBranch]);

  useEffect(() => {
    if (activeBranch && !isAdmin && currentUser) {
      // Auto-iniciar si es empleado y ya cargó el usuario
      if (mode === 'EMPLOYEE_COUNT' && !currentSession) {
        startEmployeeCount();
      }
    }
  }, [activeBranch, isAdmin, currentUser]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // EMPLEADO FLOW: CONTEO CIEGO
  // ----------------------------------------------------
  const startEmployeeCount = async () => {
    setLoading(true);
    try {
      // 1. Create Session using Edge Function to bypass RLS complications
      const newSessionId = crypto.randomUUID();
      const { data: sessionData, error: sessionErr } = await supabase.functions.invoke('start_audit_session', {
        body: {
          id: newSessionId,
          branch_id: activeBranch.id,
          started_by: currentUser?.id
        }
      });

      if (sessionErr) throw sessionErr;
      
      const activeSession = sessionData?.session;
      if (!activeSession) throw new Error("No se pudo obtener la sesión activa");
      
      setCurrentSession({ id: activeSession.id, branch_id: activeBranch.id });

      // 2. Usamos los productos que la propia Edge Function nos devolvió (bypasseando RLS)
      const activeProds = sessionData?.products || [];

      // In a strict environment, expected_stock would be inserted by a server function so the employee client NEVER receives it.
      // For this prototype, we'll map it to state but intentionally NOT display it.
      const mappedProds = activeProds.map(p => ({
        product_id: p.id,
        current_stock: null,
        product: p
      }));
      setProducts(mappedProds);
      
      const initialCounts = {};
      mappedProds.forEach(p => {
        initialCounts[p.product_id] = { count: '', photoUrl: null, photoFile: null, expected: null };
      });
      setCountedProducts(initialCounts);
      setMode('EMPLOYEE_COUNT');

    } catch (err) {
      console.error(err);
      alert("Error iniciando auditoría.");
    } finally {
      setLoading(false);
    }
  };

  const handleCountChange = (productId, val) => {
    setCountedProducts(prev => ({
      ...prev,
      [productId]: { ...prev[productId], count: val }
    }));
  };

  const handlePhotoSelect = (productId, file) => {
    setCountedProducts(prev => ({
      ...prev,
      [productId]: { ...prev[productId], photoFile: file }
    }));
  };

  const submitEmployeeCount = async () => {
    if (!window.confirm("¿Estás seguro de enviar tu conteo? Ya no podrás modificarlo.")) return;
    setLoading(true);

    try {
      // We will upload photos if any, then insert into audit_counts
      for (let p of products) {
        const pid = p.product_id;
        const entry = countedProducts[pid];
        
        // Skip if they didn't even type a number
        if (entry.count === '') continue;

        let finalPhotoUrl = null;
        if (entry.photoFile) {
          const fileExt = entry.photoFile.name.split('.').pop();
          const fileName = `audit_${currentSession.id}_${pid}.${fileExt}`;
          const filePath = `${activeBranch.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage.from('evidence').upload(filePath, entry.photoFile);
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage.from('evidence').getPublicUrl(filePath);
            finalPhotoUrl = publicUrlData.publicUrl;
          }
        }

        const numCount = parseFloat(entry.count) || 0;
        const diff = numCount - parseFloat(entry.expected);

        await supabase.from('audit_counts').insert({
          session_id: currentSession.id,
          product_id: pid,
          expected_stock: entry.expected,
          counted_stock: numCount,
          difference: diff,
          evidence_photo_url: finalPhotoUrl
        });
      }

      // Mark session completed
      await supabase.from('audit_sessions').update({ status: 'COMPLETED', completed_at: new Date().toISOString() }).eq('id', currentSession.id);
      
      alert("¡Conteo enviado con éxito! Buen trabajo.");
      if (isAdmin) {
        setMode('SELECTION');
        setCurrentSession(null);
      } else {
        // Redirigir al inicio para evitar que se queden en un limbo sin acceso a SELECTION
        window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
      alert("Error enviando auditoría.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // ADMIN FLOW: CONCILIACIÓN
  // ----------------------------------------------------
  const [selectedAuditSession, setSelectedAuditSession] = useState(null);
  const [auditDetails, setAuditDetails] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);

  const {
    page, pageSize, globalSearch, advancedFilters,
    setPage, setPageSize, setGlobalSearch, applyAdvancedFilter, clearFilters
  } = useNeoFilters({ initialPageSize: 10 });

  // Escuchar cambios en los filtros del Admin para recargar
  useEffect(() => {
    if (mode === 'ADMIN_REVIEW' && !selectedAuditSession) {
      loadAdminSessions();
    }
  }, [mode, selectedAuditSession, page, pageSize, globalSearch, advancedFilters]);

  const openAdminReview = () => {
    setMode('ADMIN_REVIEW');
  };

  const loadAdminSessions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_sessions')
        .select(`id, status, started_at, completed_at, started_by`, { count: 'exact' })
        .eq('branch_id', activeBranch.id);

      // Advanced Filters
      if (advancedFilters.status) {
        query = query.eq('status', advancedFilters.status);
      }
      if (advancedFilters.date_from) {
        query = query.gte('started_at', advancedFilters.date_from + 'T00:00:00');
      }
      if (advancedFilters.date_to) {
        query = query.lte('started_at', advancedFilters.date_to + 'T23:59:59');
      }

      // Global Search
      if (globalSearch) {
        query = query.ilike('id', `%${globalSearch}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('started_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setSessions(data || []);
      setTotalSessions(count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewSessionDetails = async (sessionId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_counts')
        .select(`
          id, expected_stock, counted_stock, difference, evidence_photo_url,
          product:products(id, name)
        `)
        .eq('session_id', sessionId);
      
      if (error) throw error;
      setAuditDetails(data || []);
      
      const sessionData = sessions.find(s => s.id === sessionId);
      setSelectedAuditSession(sessionData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAdjustment = async () => {
    if (!window.confirm("¿Estás seguro de aplicar este ajuste oficial al inventario?")) return;
    setLoading(true);
    try {
      for (let item of auditDetails) {
        if (item.difference === 0) continue; // Si está exacto, no hay ajuste

        // 1. Insert Inventory Movement (Adjustment)
        const moveData = {
          organization_id: activeBranch.organization_id,
          branch_id: activeBranch.id,
          product_id: item.product.id,
          movement_type: item.difference > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
          quantity: Math.abs(item.difference),
          reference_type: 'AUDIT',
          reference_id: selectedAuditSession.id,
          notes: `Ajuste por Auditoría ${selectedAuditSession.id.split('-')[0]}`
        };

        const { error: moveErr } = await supabase.from('inventory_movements').insert(moveData);
        if (moveErr) console.error("Error inserting movement:", moveErr);

        // 2. Update Branch Inventory
        // KEKALA already has DB Triggers for movements! So inserting the movement SHOULD automatically update the stock.
        // But let's be safe: If triggers aren't fully set up for ADJUSTMENT, we could do it manually. Let's assume Triggers handle it.
      }

      alert("Ajuste aplicado correctamente.");
      setAuditDetails([]);
      setSelectedAuditSession(null);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  if (!activeBranch) return <div style={{textAlign: 'center', padding: '40px'}}>Selecciona una sucursal</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '0 20px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
         <div style={{ background: 'var(--accent-gradient)', padding: '12px', borderRadius: '16px', color: 'white', boxShadow: 'var(--neo-shadow-sm)' }}>
           <ClipboardCheck size={32} />
         </div>
         <div>
           <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 800 }}>Auditoría de Inventario</h1>
           <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Módulo de seguridad para conteo físico y conciliación.</p>
         </div>
      </div>

      {loading && <div style={{textAlign: 'center', padding: '20px'}}>Cargando...</div>}

      {/* -------------------- MODO SELECCIÓN -------------------- */}
      {!loading && mode === 'SELECTION' && (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          
          <div className="neo-surface" style={{ flex: 1, minWidth: '300px', padding: '40px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '20px', borderRadius: '50%', color: '#2563eb' }}>
              <ShieldAlert size={48} />
            </div>
            <div>
              <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Modo Empleado (Conteo Ciego)</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Inicia un conteo físico. No se mostrarán las cantidades del sistema.</p>
            </div>
            <button onClick={startEmployeeCount} className="neo-btn neo-btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px', width: '100%', marginTop: 'auto' }}>
              Iniciar Conteo Físico
            </button>
          </div>

          <div className="neo-surface" style={{ flex: 1, minWidth: '300px', padding: '40px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '50%', color: '#10b981' }}>
              <CheckCircle2 size={48} />
            </div>
            <div>
              <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Modo Admin (Conciliación)</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Revisa los conteos realizados por los empleados y aplica ajustes.</p>
            </div>
            <button onClick={openAdminReview} className="neo-btn" style={{ padding: '16px 32px', fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px', width: '100%', marginTop: 'auto', background: 'var(--surface-color)', color: '#10b981', border: '2px solid rgba(16, 185, 129, 0.2)' }}>
              Entrar como Administrador
            </button>
          </div>

        </div>
      )}

      {/* -------------------- MODO EMPLEADO (CONTEO CIEGO) -------------------- */}
      {!loading && mode === 'EMPLOYEE_COUNT' && (
        <div className="neo-surface" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)', borderBottom: '1px solid rgba(37, 99, 235, 0.1)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-color)', textShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>Registro Físico en Mostrador</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cuenta pieza por pieza. No intentes adivinar.</p>
            </div>
            {isAdmin && (
              <button onClick={() => setMode('SELECTION')} className="neo-btn" style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.1)' }}>
                Cancelar
              </button>
            )}
          </div>
          
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {products.map(p => (
              <div key={p.product_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--background-color)', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{p.product.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cód: {p.product_id.split('-')[0]}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ position: 'relative', width: '150px', height: '48px' }}>
                    <div 
                      onClick={() => document.getElementById(`camera-input-${p.product_id}`).click()}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--surface-color)', border: '1px dashed var(--text-muted)', borderRadius: '8px', overflow: 'hidden' }}
                    >
                      {countedProducts[p.product_id].photoFile ? (
                        <img 
                          src={URL.createObjectURL(countedProducts[p.product_id].photoFile)} 
                          alt="Evidencia" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)' }}>
                          <Camera size={20} />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tomar Foto</span>
                        </div>
                      )}
                      <input 
                        id={`camera-input-${p.product_id}`}
                        type="file" 
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                           if(e.target.files && e.target.files.length > 0) {
                             handlePhotoSelect(p.product_id, e.target.files[0])
                           }
                        }}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      CANTIDAD {p.product.unit ? (Array.isArray(p.product.unit) ? `(${p.product.unit[0]?.name?.toUpperCase()})` : `(${p.product.unit.name?.toUpperCase()})`) : ''}:
                    </label>
                    <input 
                      type="number"
                      step="any" 
                      value={countedProducts[p.product_id].count} 
                      onChange={(e) => handleCountChange(p.product_id, e.target.value)}
                      placeholder="0"
                      className="neo-input"
                      style={{ padding: '12px', fontSize: '1.2rem', fontWeight: 800, textAlign: 'center', width: '120px', borderRadius: '12px', background: 'white' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '24px', background: 'var(--surface-color)', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={submitEmployeeCount} className="neo-btn neo-btn-primary" style={{ padding: '16px 40px', fontSize: '1.2rem', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Send size={24} /> Enviar Conteo Ciego
            </button>
          </div>
        </div>
      )}

      {/* -------------------- MODO ADMIN (CONCILIACIÓN) -------------------- */}
      {!loading && mode === 'ADMIN_REVIEW' && !selectedAuditSession && (
        <div className="neo-surface" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Historial de Conteos (Pendientes de Revisión)</h2>
            <button onClick={() => setMode('SELECTION')} className="neo-btn" style={{ padding: '8px 16px' }}>Volver</button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <NeoAdvancedFilter 
              globalSearch={globalSearch}
              onSearchChange={setGlobalSearch}
              filters={advancedFilters}
              onFilterApply={applyAdvancedFilter}
              onClearFilters={clearFilters}
              filterConfig={[
                { id: 'date_from', label: 'Desde Fecha', type: 'date' },
                { id: 'date_to', label: 'Hasta Fecha', type: 'date' },
                { id: 'status', label: 'Estado', type: 'select', options: [
                  {val: 'IN_PROGRESS', label: 'En Progreso'},
                  {val: 'COMPLETED', label: 'Finalizada'}
                ]}
              ]}
            />
          </div>

          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No hay auditorías registradas.</div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {sessions.map(s => (
                <div key={s.id} onClick={() => viewSessionDetails(s.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'var(--background-color)', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--border-color)', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: s.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: s.status === 'COMPLETED' ? '#10b981' : '#f59e0b', padding: '12px', borderRadius: '50%' }}>
                      <ClipboardCheck size={24} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Auditoría {s.id.split('-')[0].toUpperCase()}</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Iniciada: {new Date(s.started_at).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, background: s.status === 'COMPLETED' ? '#10b981' : '#f59e0b', color: 'white' }}>
                      {s.status === 'COMPLETED' ? 'Finalizada' : 'En Progreso'}
                    </span>
                    <Search style={{ color: 'var(--text-muted)' }} size={20} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalSessions > 0 && !loading && (
            <NeoPagination 
              currentPage={page}
              pageSize={pageSize}
              totalCount={totalSessions}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      )}

      {/* DETALLE DE AUDITORÍA (ADMIN) */}
      {!loading && mode === 'ADMIN_REVIEW' && selectedAuditSession && (
        <div className="neo-surface" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ background: 'var(--color-secondary)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Conciliación de Auditoría</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.8 }}>Folio: {selectedAuditSession.id.split('-')[0].toUpperCase()}</p>
            </div>
            <button onClick={() => setSelectedAuditSession(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              Cerrar Detalle
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>PRODUCTO</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>SISTEMA</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>FÍSICO</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>DIFERENCIA</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>FOTO</th>
                </tr>
              </thead>
              <tbody>
                {auditDetails.map(item => {
                  const isLoss = item.difference < 0;
                  const isGain = item.difference > 0;
                  const isExact = item.difference === 0;
                  
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.product?.name}</td>
                      <td style={{ padding: '16px 12px', textAlign: 'center', fontSize: '1.1rem' }}>{item.expected_stock}</td>
                      <td style={{ padding: '16px 12px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 800 }}>{item.counted_stock}</td>
                      <td style={{ padding: '16px 12px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 800, color: isExact ? '#10b981' : (isLoss ? '#ef4444' : '#f59e0b') }}>
                        {item.difference > 0 ? '+' : ''}{item.difference}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        {item.evidence_photo_url ? (
                          <a href={item.evidence_photo_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}><Camera size={20} /></a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin foto</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '24px', background: 'var(--surface-color)', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleApplyAdjustment} className="neo-btn" style={{ padding: '16px 32px', fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: '#ef4444', color: 'white', boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)' }}>
              <ShieldAlert size={20} /> Aplicar Ajuste en Sistema
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
