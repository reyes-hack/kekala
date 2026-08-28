import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { 
  Calculator, FileText, CheckCircle2, ShieldAlert, AlertCircle, 
  Settings, DollarSign, CreditCard, ArrowRightLeft, Plus, X, Trash2,
  ArrowDownLeft, ArrowUpRight, Banknote, MonitorSmartphone, Calendar, Info
} from 'lucide-react';
import { useNeoFilters } from '../hooks/useNeoFilters';
import { NeoAdvancedFilter } from '../components/NeoAdvancedFilter';
import { NeoPagination } from '../components/NeoPagination';
import { NeoDatePicker } from '../components/NeoDatePicker';
import { NeoSelect } from '../components/NeoSelect';
import { AuthContext } from '../components/ProtectedRoute';

export function CortesDeCaja() {
  const { isAdmin } = useContext(AuthContext);
  const { activeBranch } = useBranchStore();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  
  // Modes: 'SELECTION', 'EMPLOYEE_CUT', 'ADMIN_FINANCES'
  const [mode, setMode] = useState(isAdmin ? 'SELECTION' : 'EMPLOYEE_CUT');

  useEffect(() => {
    if (activeBranch) {
      loadInitialData();
    }
  }, [activeBranch]);

  // The buggy useEffect referencing reportedCash was removed here as initial states are already set.

  const [alreadyClosedToday, setAlreadyClosedToday] = useState(false);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (!isAdmin && user && activeBranch) {
      const getMXDateStr = () => {
        const mxDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
        return [
          mxDate.getFullYear(),
          String(mxDate.getMonth() + 1).padStart(2, '0'),
          String(mxDate.getDate()).padStart(2, '0')
        ].join('-');
      };
      const today = getMXDateStr();
        const { data: existingCut } = await supabase
          .from('cash_closures')
          .select('id')
          .eq('branch_id', activeBranch.id)
          .eq('close_date', today)
          .maybeSingle();

        if (existingCut) {
          setAlreadyClosedToday(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // MODO EMPLEADO (HACER CORTE)
  // ----------------------------------------------------
  const [cutDate, setCutDate] = useState(() => {
    const mxDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
    return [
      mxDate.getFullYear(),
      String(mxDate.getMonth() + 1).padStart(2, '0'),
      String(mxDate.getDate()).padStart(2, '0')
    ].join('-');
  });
  const [posTerminalSales, setPosTerminalSales] = useState('');
  const [cashSales, setCashSales] = useState('');
  const [totalTickets, setTotalTickets] = useState('');
  const [manualDifference, setManualDifference] = useState('');
  
  const startEmployeeCut = () => {
    setMode('EMPLOYEE_CUT');
    const mxDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
    setCutDate([
      mxDate.getFullYear(),
      String(mxDate.getMonth() + 1).padStart(2, '0'),
      String(mxDate.getDate()).padStart(2, '0')
    ].join('-'));
    setPosTerminalSales('');
    setCashSales('');
    setTotalTickets('');
    setManualDifference('');
  };



  const submitCut = async () => {
    if (cashSales === '' || posTerminalSales === '' || manualDifference === '') {
      alert("Por favor llena las ventas en efectivo, ventas en terminal y la diferencia.");
      return;
    }
    
    if (!window.confirm("¿Estás seguro de enviar el corte?")) return;
    
    setLoading(true);
    try {
      // Validar estrictamente la sucursal del empleado contra la activa en Zustand
      const userBranchId = currentUser?.app_metadata?.branch_id;
      const isEmployee = currentUser?.app_metadata?.roles?.includes('CASHIER') || !isAdmin;
      
      if (isEmployee && userBranchId && activeBranch.id !== userBranchId) {
        alert("¡Error Crítico! Estás intentando registrar un corte para una sucursal distinta a la tuya. Por favor, refresca la página e inicia sesión nuevamente.");
        setLoading(false);
        return;
      }

      // Verificar que no haya un corte de caja registrado hoy
      const { data: existingCut } = await supabase
        .from('cash_closures')
        .select('id')
        .eq('branch_id', activeBranch.id)
        .eq('close_date', cutDate)
        .maybeSingle();

      if (existingCut) {
        alert(`Ya se registró un corte de caja para el día de hoy (${cutDate}) en esta sucursal.`);
        setLoading(false);
        return;
      }

      const { data: closure, error } = await supabase.from('cash_closures').insert({
        organization_id: activeBranch.organization_id,
        branch_id: activeBranch.id,
        close_date: cutDate,
        opened_by: currentUser?.id,
        closed_by: currentUser?.id,
        opening_cash: 0,
        declared_cash: 0,
        pos_terminal_sales: parseFloat(posTerminalSales) || 0,
        cash_sales: parseFloat(cashSales) || 0,
        cash_ins: 0,
        cash_outs: 0,
        total_tickets: parseInt(totalTickets, 10) || 0,
        manual_difference: parseFloat(manualDifference) || 0
      }).select().single();

      if (error) throw error; 

      alert("Corte enviado correctamente.");
      if (isAdmin) {
        setMode('SELECTION');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      alert("Error al guardar el corte: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // MODO ADMIN (SÁBANA FINANCIERA)
  // ----------------------------------------------------
  const [closures, setClosures] = useState([]);
  const [totalClosures, setTotalClosures] = useState(0);
  const [branchesMap, setBranchesMap] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [advancedFilters, setAdvancedFilters] = useState({ branch_id: '', month: '' });

  useEffect(() => {
    if (isAdmin && mode === 'ADMIN_FINANCES') {
      supabase.from('branches').select('id, name').then(({data}) => {
         if (data) {
           const map = {};
           data.forEach(b => map[b.id] = b.name);
           setBranchesMap(map);
         }
      });
    }
  }, [isAdmin, mode]);

  useEffect(() => {
    if (mode === 'ADMIN_FINANCES') {
      loadAdminClosures();
    }
  }, [mode, activeBranch, page, pageSize, advancedFilters]);

  const loadAdminClosures = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cash_closures')
        .select('*', { count: 'exact' });

      if (advancedFilters.branch_id) {
         query = query.eq('branch_id', advancedFilters.branch_id);
      } else if (activeBranch && activeBranch.id !== 'all') {
         query = query.eq('branch_id', activeBranch.id);
      }

      if (advancedFilters.month) {
        const yearMonth = advancedFilters.month;
        query = query
          .gte('close_date', `${yearMonth}-01`)
          .lte('close_date', `${yearMonth}-31`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('close_date', { ascending: true })
        .range(from, to);

      if (error) throw error;
      
      let closuresData = data || [];
      
      const userIds = [...new Set(closuresData.map(c => c.opened_by).filter(Boolean))];
      if (userIds.length > 0) {
         const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, display_name').in('id', userIds);
         if (profiles) {
            const profMap = {};
            profiles.forEach(p => profMap[p.id] = p);
            closuresData = closuresData.map(c => ({
              ...c,
              profiles: profMap[c.opened_by] || null
            }));
         }
      }
      
      setClosures(closuresData);
      setTotalClosures(count || 0);
    } catch (err) {
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
           <Calculator size={32} />
         </div>
         <div>
           <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 800 }}>Cortes de Caja y Finanzas</h1>
           <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Cierre diario y Estado de Resultados consolidado.</p>
         </div>
      </div>

      {/* -------------------- MODO SELECCIÓN -------------------- */}
      {!loading && mode === 'SELECTION' && (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          
          <div className="neo-surface" style={{ flex: 1, minWidth: '300px', padding: '40px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '20px', borderRadius: '50%', color: '#2563eb' }}>
              <ArrowRightLeft size={48} />
            </div>
            <div>
              <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Hacer Corte Diario</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Módulo para empleados. Reporta el efectivo y vouchers del día.</p>
            </div>
            <button onClick={startEmployeeCut} className="neo-btn neo-btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px', width: '100%', marginTop: 'auto' }}>
              Iniciar Corte
            </button>
          </div>

          <div className="neo-surface" style={{ flex: 1, minWidth: '300px', padding: '40px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '50%', color: '#10b981' }}>
              <FileText size={48} />
            </div>
            <div>
              <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Sábana Financiera (Admin)</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Revisa todo el mes consolidado, comisiones y rentabilidad.</p>
            </div>
            <button onClick={() => setMode('ADMIN_FINANCES')} className="neo-btn" style={{ padding: '16px 32px', fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px', width: '100%', marginTop: 'auto', background: 'var(--surface-color)', color: '#10b981', border: '2px solid rgba(16, 185, 129, 0.2)' }}>
              Ver Resultados Financieros
            </button>
          </div>
        </div>
      )}

      {/* -------------------- MODO EMPLEADO -------------------- */}
      {mode === 'EMPLOYEE_CUT' && (
        <div className="neo-surface fade-in" style={{ padding: '32px', borderRadius: '24px', maxWidth: '800px', margin: '0 auto', border: '1px solid var(--border-color)' }}>
          {alreadyClosedToday ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'var(--background-color)', padding: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={48} style={{ color: 'var(--status-success)', opacity: 0.8 }} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Corte Registrado</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>El corte de caja de hoy ({cutDate}) ya ha sido enviado y no puede ser modificado.</p>
            </div>
          ) : (
            <>
              <div style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(37, 99, 235, 0.02) 100%)', padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(37, 99, 235, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'var(--accent-gradient)', padding: '16px', borderRadius: '16px', color: 'white', boxShadow: 'var(--neo-shadow-sm)' }}>
                    <DollarSign size={32} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-color)' }}>Registro de Corte</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', color: 'var(--text-muted)' }}>Captura estructurada de montos de cierre.</p>
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => setMode('SELECTION')} className="neo-btn" style={{ padding: '12px 24px', background: 'white', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', fontWeight: 600, boxShadow: 'var(--neo-shadow-sm)' }}>
                    Cancelar
                  </button>
                )}
              </div>
              
              <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <NeoDatePicker 
                      label="Fecha de Corte" 
                      value={cutDate} 
                      onChange={e => setCutDate(e.target.value)}
                      disabled
                    />
                  </div>
                </div>

                <div style={{ background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={20} color="var(--accent-color)" /> Ventas e Ingresos
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Total de Tickets</label>
                      <div style={{ position: 'relative' }}>
                        <FileText size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="number" className="neo-input" style={{ width: '100%', padding: '16px 16px 16px 48px', fontSize: '1.2rem' }} placeholder="0" value={totalTickets} onChange={e => setTotalTickets(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Ventas en Efectivo</label>
                      <div style={{ position: 'relative' }}>
                        <Banknote size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="number" step="0.01" className="neo-input" style={{ width: '100%', padding: '16px 16px 16px 48px', fontSize: '1.2rem' }} placeholder="$0.00" value={cashSales} onChange={e => setCashSales(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Ventas Terminal (Tarjeta)</label>
                      <div style={{ position: 'relative' }}>
                        <CreditCard size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="number" step="0.01" className="neo-input" style={{ width: '100%', padding: '16px 16px 16px 48px', fontSize: '1.2rem' }} placeholder="$0.00" value={posTerminalSales} onChange={e => setPosTerminalSales(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={20} color="var(--accent-color)" /> Diferencia Manual
                  </h3>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Registra si hubo faltante (negativo) o sobrante (positivo) de efectivo en caja.
                  </p>
                  <div>
                    <div style={{ position: 'relative', maxWidth: '300px' }}>
                      <ArrowRightLeft size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="number" step="0.01" className="neo-input" style={{ width: '100%', padding: '16px 16px 16px 48px', fontSize: '1.2rem' }} placeholder="Faltante (-) / Sobrante (+)" value={manualDifference} onChange={e => setManualDifference(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '24px 40px', background: 'rgba(255, 255, 255, 0.5)', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(10px)' }}>
                <button onClick={submitCut} className="neo-btn neo-btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem', fontWeight: 800, borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)' }}>
                  Enviar Corte Definitivo
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* -------------------- MODO ADMIN -------------------- */}
      {mode === 'ADMIN_FINANCES' && (
        <div className="neo-surface fade-in" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Sábana de Cierres Diarios</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setMode('SELECTION')} className="neo-btn" style={{ padding: '8px 16px' }}>Volver</button>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
          </div>



          {closures.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
               <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
               <h3>No hay cortes registrados en este periodo</h3>
               <p>Los cortes realizados por las sucursales aparecerán aquí estructurados.</p>
             </div>
          ) : (
             <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
               <div style={{ overflowX: 'auto' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                   <thead>
                     <tr style={{ background: 'linear-gradient(90deg, rgba(37,99,235,0.05) 0%, rgba(139,92,246,0.05) 100%)', borderBottom: '2px solid var(--border-color)' }}>
                       <th style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>FECHA</th>
                       <th style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>SUCURSAL</th>
                       <th style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>REGISTRADO POR</th>
                       <th style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>VENTAS EFVO.</th>
                       <th style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>VENTAS TERM.</th>
                       <th style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--primary-color)', fontWeight: 800, letterSpacing: '0.5px' }}>VENTAS BRUTAS</th>
                       <th style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>TICKETS</th>
                       <th style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>TKT. PROM.</th>
                       <th style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>DIFERENCIA</th>
                     </tr>
                   </thead>
                   <tbody>
                     {closures.map((closure, idx) => {
                       const totalVentas = closure.cash_sales + closure.pos_terminal_sales;
                       const ticketPromedio = closure.total_tickets > 0 ? (totalVentas / closure.total_tickets).toFixed(2) : 0;
                       const diff = closure.manual_difference || 0;
                       const rowBg = idx % 2 === 0 ? 'var(--background-color)' : 'white';
                       
                       return (
                         <tr key={closure.id} style={{ background: rowBg, borderBottom: '1px solid var(--border-color)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.03)'; }} onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}>
                           <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                               {closure.close_date}
                             </div>
                           </td>
                           <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                             {branchesMap[closure.branch_id] || 'N/A'}
                           </td>
                           <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                             {closure.profiles?.display_name || closure.profiles?.first_name ? `${closure.profiles?.first_name || ''} ${closure.profiles?.last_name || ''}`.trim() || closure.profiles?.display_name : 'No Disp.'}
                           </td>
                           <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 500 }}>
                             <span style={{ color: 'var(--text-muted)', marginRight: '2px' }}>$</span>{closure.cash_sales?.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                           </td>
                           <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 500 }}>
                             <span style={{ color: 'var(--text-muted)', marginRight: '2px' }}>$</span>{closure.pos_terminal_sales?.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                           </td>
                           <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                             <div style={{ display: 'inline-block', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 12px', borderRadius: '20px', fontWeight: 800 }}>
                               ${totalVentas.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                             </div>
                           </td>
                           <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>
                             {closure.total_tickets}
                           </td>
                           <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-muted)' }}>
                             ${ticketPromedio}
                           </td>
                           <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '0.9rem', color: diff < 0 ? 'var(--status-danger)' : (diff > 0 ? '#10b981' : 'var(--text-secondary)'), fontWeight: 700 }}>
                             {diff < 0 ? '-' : (diff > 0 ? '+' : '')}${Math.abs(diff).toFixed(2)}
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
             </div>
          )}

          {totalClosures > 0 && !loading && (
            <NeoPagination 
              currentPage={page}
              pageSize={pageSize}
              totalCount={totalClosures}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}

        </div>
      )}

    </div>
  );
}
