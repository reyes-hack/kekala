import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { 
  Calculator, FileText, CheckCircle2, ShieldAlert, AlertCircle, 
  Settings, DollarSign, CreditCard, ArrowRightLeft, Plus, X, Trash2
} from 'lucide-react';
import { useNeoFilters } from '../hooks/useNeoFilters';
import { NeoAdvancedFilter } from '../components/NeoAdvancedFilter';
import { NeoPagination } from '../components/NeoPagination';
import { NeoDatePicker } from '../components/NeoDatePicker';
import { NeoSelect } from '../components/NeoSelect';

export function CortesDeCaja() {
  const { activeBranch } = useBranchStore();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Modes: 'SELECTION', 'EMPLOYEE_CUT', 'ADMIN_FINANCES'
  const [mode, setMode] = useState('SELECTION');

  useEffect(() => {
    if (activeBranch) {
      loadInitialData();
    }
  }, [activeBranch]);

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
  // MODO EMPLEADO (HACER CORTE)
  // ----------------------------------------------------
  const [cutDate, setCutDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportedCash, setReportedCash] = useState('');
  const [reportedVouchers, setReportedVouchers] = useState('');
  const [withdrawals, setWithdrawals] = useState([]); // [{ concept: '', amount: '' }]
  
  const startEmployeeCut = () => {
    setMode('EMPLOYEE_CUT');
    // Reset form
    setCutDate(new Date().toISOString().split('T')[0]);
    setReportedCash('');
    setReportedVouchers('');
    setWithdrawals([]);
  };

  const addWithdrawal = () => {
    setWithdrawals([...withdrawals, { concept: '', amount: '' }]);
  };

  const updateWithdrawal = (index, field, value) => {
    const newW = [...withdrawals];
    newW[index][field] = value;
    setWithdrawals(newW);
  };

  const removeWithdrawal = (index) => {
    const newW = [...withdrawals];
    newW.splice(index, 1);
    setWithdrawals(newW);
  };

  const submitCut = async () => {
    if (!reportedCash || !reportedVouchers) {
      alert("Por favor llena el efectivo y vouchers contados.");
      return;
    }
    
    if (!window.confirm("¿Estás seguro de enviar el corte?")) return;
    
    setLoading(true);
    try {
      // 1. Insert into cash_closures (Angel's tables don't exist yet, this will fail elegantly)
      const withdrawalTotal = withdrawals.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
      
      const { data: closure, error } = await supabase.from('cash_closures').insert({
        organization_id: activeBranch.organization_id,
        branch_id: activeBranch.id,
        date: cutDate,
        closed_by: currentUser?.id,
        reported_cash: parseFloat(reportedCash),
        reported_vouchers: parseFloat(reportedVouchers),
        status: 'DRAFT' // Backend trigger could calculate Foodbot totals and move to COMPLETED
      }).select().single();

      // We ignore error for now since table doesn't exist, just catch it.
      if (error && error.code !== 'PGRST205') throw error; // If it's 205 (not found), we know Angel hasn't built it.

      // 2. Insert withdrawals into expenses (this table exists!)
      if (withdrawals.length > 0) {
        const expensesData = withdrawals.map(w => ({
          organization_id: activeBranch.organization_id,
          branch_id: activeBranch.id,
          expense_date: cutDate,
          concept: `RETIRO CAJA: ${w.concept}`,
          amount: parseFloat(w.amount) || 0,
          category: 'RETIRO_CAJA',
          registered_by: currentUser?.id
        }));
        await supabase.from('expenses').insert(expensesData);
      }

      alert("Corte enviado correctamente (Simulado).");
      setMode('SELECTION');
    } catch (err) {
      console.error(err);
      if (err.code === 'PGRST205') {
        alert("La base de datos de cortes aún no está lista. Pero la interfaz está funcional.");
      } else {
        alert("Error al guardar el corte.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // MODO ADMIN (SÁBANA FINANCIERA)
  // ----------------------------------------------------
  const [closures, setClosures] = useState([]);
  const [totalClosures, setTotalClosures] = useState(0);

  // Estado del Modal de Configuración Financiera
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configMonth, setConfigMonth] = useState(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [fixedCosts, setFixedCosts] = useState([]);

  const {
    page, pageSize, globalSearch, advancedFilters,
    setPage, setPageSize, setGlobalSearch, applyAdvancedFilter, clearFilters
  } = useNeoFilters({ initialPageSize: 31 }); // 31 days normally

  const openAdminFinances = () => {
    setMode('ADMIN_FINANCES');
  };

  const openConfigModal = async () => {
    setIsConfigModalOpen(true);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('branch_fixed_costs')
        .select('*')
        .eq('branch_id', activeBranch.id)
        .eq('month_year', configMonth);
        
      if (error && error.code !== 'PGRST205') throw error;
      
      if (error?.code === 'PGRST205') {
        // Angel hasn't built table yet
        setFixedCosts([{ id: Date.now().toString(), category: 'RENTA', concept: 'Renta Local', amount: '' }]);
      } else {
        setFixedCosts(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      // Delete old config for this month and branch
      await supabase.from('branch_fixed_costs')
        .delete()
        .eq('branch_id', activeBranch.id)
        .eq('month_year', configMonth);

      // Insert new config
      const validCosts = fixedCosts.filter(c => c.concept && c.amount).map(c => ({
        branch_id: activeBranch.id,
        month_year: configMonth,
        category: c.category,
        concept: c.concept,
        amount: parseFloat(c.amount)
      }));

      if (validCosts.length > 0) {
        await supabase.from('branch_fixed_costs').insert(validCosts);
      }
      
      alert('Configuración guardada (Simulado si no hay BD)');
      setIsConfigModalOpen(false);
    } catch (err) {
      console.error(err);
      if (err.code === 'PGRST205') {
        alert("Configuración guardada (Backend pendiente)");
        setIsConfigModalOpen(false);
      } else {
        alert('Error al guardar configuración');
      }
    } finally {
      setLoading(false);
    }
  };

  const addFixedCostRow = () => {
    setFixedCosts([...fixedCosts, { id: Date.now().toString(), category: 'OTROS', concept: '', amount: '' }]);
  };

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
        .select('*', { count: 'exact' })
        .eq('branch_id', activeBranch.id);

      if (advancedFilters.month) {
        // e.g. "2026-06"
        const yearMonth = advancedFilters.month;
        query = query
          .gte('date', `${yearMonth}-01`)
          .lte('date', `${yearMonth}-31`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('date', { ascending: true })
        .range(from, to);

      if (error && error.code !== 'PGRST205') throw error;
      setClosures(data || []);
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
          
          {/* Tarjeta Empleado */}
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

          {/* Tarjeta Admin */}
          <div className="neo-surface" style={{ flex: 1, minWidth: '300px', padding: '40px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '50%', color: '#10b981' }}>
              <FileText size={48} />
            </div>
            <div>
              <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Sábana Financiera (Admin)</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Revisa todo el mes consolidado, comisiones y rentabilidad.</p>
            </div>
            <button onClick={openAdminFinances} className="neo-btn" style={{ padding: '16px 32px', fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px', width: '100%', marginTop: 'auto', background: 'var(--surface-color)', color: '#10b981', border: '2px solid rgba(16, 185, 129, 0.2)' }}>
              Ver Resultados Financieros
            </button>
          </div>
        </div>
      )}

      {/* -------------------- MODO EMPLEADO -------------------- */}
      {mode === 'EMPLOYEE_CUT' && (
        <div className="neo-surface fade-in" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)', borderBottom: '2px solid rgba(0,0,0,0.02)', boxShadow: 'var(--neo-shadow-flat)' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-color)' }}>Registro de Corte</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Ingresa lo que tienes físicamente en la caja.</p>
            </div>
            <button onClick={() => setMode('SELECTION')} className="neo-btn">
              Cancelar
            </button>
          </div>
          
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Fecha de Corte:</label>
                <NeoDatePicker value={cutDate} onChange={setCutDate} />
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <DollarSign size={16} /> Efectivo Físico Contado ($)
                </label>
                <input 
                  type="number" 
                  value={reportedCash}
                  onChange={(e) => setReportedCash(e.target.value)}
                  className="neo-input" 
                  placeholder="0.00"
                  style={{ fontSize: '1.5rem', padding: '20px', fontWeight: 800, textAlign: 'center', background: 'var(--surface-color)', border: 'none', borderRadius: '16px', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <CreditCard size={16} /> Suma de Vouchers (Terminal)
                </label>
                <input 
                  type="number" 
                  value={reportedVouchers}
                  onChange={(e) => setReportedVouchers(e.target.value)}
                  className="neo-input" 
                  placeholder="0.00"
                  style={{ fontSize: '1.5rem', padding: '20px', fontWeight: 800, textAlign: 'center', background: 'var(--surface-color)', border: 'none', borderRadius: '16px', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Retiros */}
            <div style={{ marginTop: '16px', padding: '24px', background: 'var(--background-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Retiros de Efectivo del Día</h3>
                <button onClick={addWithdrawal} className="neo-btn" style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={16} /> Agregar Retiro
                </button>
              </div>
              
              {withdrawals.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>No se han registrado retiros.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {withdrawals.map((w, index) => (
                    <div key={index} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={w.concept}
                        onChange={(e) => updateWithdrawal(index, 'concept', e.target.value)}
                        placeholder="Concepto (ej. Insumos, Garrafón)"
                        className="neo-input"
                        style={{ flex: 2 }}
                      />
                      <input 
                        type="number" 
                        value={w.amount}
                        onChange={(e) => updateWithdrawal(index, 'amount', e.target.value)}
                        placeholder="Monto $"
                        className="neo-input"
                        style={{ flex: 1 }}
                      />
                      <button onClick={() => removeWithdrawal(index)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}>
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div style={{ padding: '24px', background: 'var(--surface-color)', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={submitCut} className="neo-btn neo-btn-primary" style={{ padding: '16px 40px', fontSize: '1.2rem', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              Enviar Corte
            </button>
          </div>
        </div>
      )}

      {/* -------------------- MODO ADMIN -------------------- */}
      {mode === 'ADMIN_FINANCES' && (
        <div className="neo-surface fade-in" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Sábana de Cierres Diarios</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={openConfigModal} className="neo-btn" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)' }}>
                <Settings size={18} /> Configurar Finanzas
              </button>
              <button onClick={() => setMode('SELECTION')} className="neo-btn" style={{ padding: '8px 16px' }}>Volver</button>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <NeoAdvancedFilter 
              globalSearch={globalSearch}
              onSearchChange={setGlobalSearch}
              filters={advancedFilters}
              onFilterApply={applyAdvancedFilter}
              onClearFilters={clearFilters}
              filterConfig={[
                { id: 'month', label: 'Mes de Consulta', type: 'month' }
              ]}
            />
          </div>

          {closures.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
               <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
               <h3>No hay cortes registrados en este periodo</h3>
               <p>Los cortes realizados por las sucursales aparecerán aquí estructurados.</p>
             </div>
          ) : (
             <div className="neo-table-container">
               <table className="neo-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                 <thead>
                   <tr>
                     <th>FECHA</th>
                     <th>VENTAS EFVO.</th>
                     <th>VENTAS TERM.</th>
                     <th>VENTAS BRUTAS</th>
                     <th>TICKETS</th>
                     <th>TICKET PROM.</th>
                     <th>CAJA INICIAL</th>
                     <th>CAJA FINAL</th>
                     <th>DIF. EFVO</th>
                     <th>DIF. TERM</th>
                     <th>RETIROS</th>
                   </tr>
                 </thead>
                 <tbody>
                   {/* Here we will map closures. Since backend is pending, we might have 0 or dummy rows. */}
                 </tbody>
               </table>
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

      {/* -------------------- MODAL CONFIGURACIÓN FINANCIERA -------------------- */}
      {isConfigModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="neo-surface" style={{ width: '90%', maxWidth: '800px', background: 'var(--bg-color)', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '24px', background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><Settings /> Configuración de Costos Fijos</h2>
              <button onClick={() => setIsConfigModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Mes a configurar:</label>
                <input 
                  type="month" 
                  value={configMonth} 
                  onChange={(e) => {
                    setConfigMonth(e.target.value);
                    // Idealmente aquí se recargaría openConfigModal para el nuevo mes
                  }}
                  className="neo-input"
                  style={{ width: 'auto' }}
                />
              </div>

              <div style={{ background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}>Desglose de Costos Fijos</h3>
                  <button onClick={addFixedCostRow} className="neo-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }}><Plus size={16} /> Agregar Fila</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {fixedCosts.map((cost, idx) => (
                    <div key={cost.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <select 
                        value={cost.category}
                        onChange={(e) => {
                          const newC = [...fixedCosts];
                          newC[idx].category = e.target.value;
                          setFixedCosts(newC);
                        }}
                        className="neo-input"
                        style={{ flex: 1 }}
                      >
                        <option value="RENTA">Renta</option>
                        <option value="NOMINA">Nómina / Salarios</option>
                        <option value="SERVICIOS">Servicios (Luz, Agua, Internet)</option>
                        <option value="MARKETING">Marketing</option>
                        <option value="OTROS">Otros Gastos Fijos</option>
                      </select>
                      
                      <input 
                        type="text"
                        placeholder="Concepto (ej. Renta Local 5)"
                        value={cost.concept}
                        onChange={(e) => {
                          const newC = [...fixedCosts];
                          newC[idx].concept = e.target.value;
                          setFixedCosts(newC);
                        }}
                        className="neo-input"
                        style={{ flex: 2 }}
                      />
                      
                      <input 
                        type="number"
                        placeholder="Monto Mensual $"
                        value={cost.amount}
                        onChange={(e) => {
                          const newC = [...fixedCosts];
                          newC[idx].amount = e.target.value;
                          setFixedCosts(newC);
                        }}
                        className="neo-input"
                        style={{ flex: 1 }}
                      />
                      
                      <button onClick={() => {
                        const newC = [...fixedCosts];
                        newC.splice(idx, 1);
                        setFixedCosts(newC);
                      }} style={{ background: 'transparent', border: 'none', color: 'var(--status-danger)', cursor: 'pointer' }}>
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                  {fixedCosts.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No hay costos fijos configurados para este mes.</p>}
                </div>
              </div>
            </div>

            <div style={{ padding: '24px', background: 'var(--surface-color)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setIsConfigModalOpen(false)} className="neo-btn">Cancelar</button>
              <button onClick={saveConfig} className="neo-btn neo-btn-primary">Guardar Configuración</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
