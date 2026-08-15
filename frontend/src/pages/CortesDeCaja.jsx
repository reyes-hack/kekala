import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { 
  Calculator, FileText, CheckCircle2, ShieldAlert, AlertCircle, 
  Settings, DollarSign, CreditCard, ArrowRightLeft, Plus, X, Trash2,
  ArrowDownLeft, ArrowUpRight, Banknote, MonitorSmartphone, Calendar
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
  const [openingCash, setOpeningCash] = useState('');
  const [declaredCash, setDeclaredCash] = useState('');
  const [posTerminalSales, setPosTerminalSales] = useState('');
  const [cashSales, setCashSales] = useState('');
  const [cashIns, setCashIns] = useState('');
  const [cashOuts, setCashOuts] = useState('');
  const [totalTickets, setTotalTickets] = useState('');
  const [withdrawals, setWithdrawals] = useState([]); // [{ concept: '', amount: '' }]
  
  const startEmployeeCut = () => {
    setMode('EMPLOYEE_CUT');
    setCutDate(new Date().toISOString().split('T')[0]);
    setOpeningCash('');
    setDeclaredCash('');
    setPosTerminalSales('');
    setCashSales('');
    setCashIns('');
    setCashOuts('');
    setTotalTickets('');
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
    if (declaredCash === '' || posTerminalSales === '') {
      alert("Por favor llena al menos el efectivo declarado y las ventas en terminal.");
      return;
    }
    
    if (!window.confirm("¿Estás seguro de enviar el corte?")) return;
    
    setLoading(true);
    try {
      const { data: closure, error } = await supabase.from('cash_closures').insert({
        organization_id: activeBranch.organization_id,
        branch_id: activeBranch.id,
        close_date: cutDate,
        opened_by: currentUser?.id,
        closed_by: currentUser?.id,
        opening_cash: parseFloat(openingCash) || 0,
        declared_cash: parseFloat(declaredCash) || 0,
        pos_terminal_sales: parseFloat(posTerminalSales) || 0,
        cash_sales: parseFloat(cashSales) || 0,
        cash_ins: parseFloat(cashIns) || 0,
        cash_outs: parseFloat(cashOuts) || 0,
        total_tickets: parseInt(totalTickets, 10) || 0,
      }).select().single();

      if (error) throw error; 

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
          .gte('close_date', `${yearMonth}-01`)
          .lte('close_date', `${yearMonth}-31`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('close_date', { ascending: true })
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

      {/* -------------------- MODO EMPLEADO (HACER CORTE) -------------------- */}
      {/* -------------------- MODO EMPLEADO (HACER CORTE) -------------------- */}
      {!loading && mode === 'EMPLOYEE_CUT' && (
        <div className="neo-surface fade-in" style={{ maxWidth: '800px', margin: '0 auto 60px auto', padding: '0', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.4)', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)' }}>
          
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
            
            {/* Metadatos (Fecha, Tickets) */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} style={{color: 'var(--primary-color)'}}/> Fecha de Corte
                </label>
                <NeoDatePicker value={cutDate} onChange={(e) => setCutDate(e.target.value)} />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} style={{color: 'var(--primary-color)'}}/> Número de Tickets
                </label>
                <input type="number" value={totalTickets} onChange={(e) => setTotalTickets(e.target.value)} className="neo-input" placeholder="0" style={{ padding: '12px 16px', width: '100%', borderRadius: '12px', background: 'var(--background-color)', border: '1px solid var(--border-color)', fontWeight: 600, fontSize: '1rem' }} />
              </div>
            </div>

            {/* TABLA DE CAPTURA */}
            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--surface-color)', boxShadow: 'var(--neo-shadow-sm)' }}>
              {/* Header de Tabla */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', background: 'rgba(0,0,0,0.03)', padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Concepto</div>
                <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Monto ($)</div>
              </div>

              {/* Fila 1: Apertura */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(37,99,235,0.1)', padding: '8px', borderRadius: '8px', color: '#2563eb' }}><ArrowDownLeft size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Fondo de Caja (Apertura)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dinero con el que inició el turno</div>
                  </div>
                </div>
                <div>
                  <input type="number" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} className="neo-input" placeholder="0.00" style={{ width: '100%', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                </div>
              </div>

              {/* Fila 2: Cierre Físico */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(16,185,129,0.1)', padding: '8px', borderRadius: '8px', color: '#10b981' }}><DollarSign size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Efectivo Declarado (Físico)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lo que hay realmente en la caja al cerrar</div>
                  </div>
                </div>
                <div>
                  <input type="number" value={declaredCash} onChange={(e) => setDeclaredCash(e.target.value)} className="neo-input" placeholder="0.00" style={{ width: '100%', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                </div>
              </div>

              {/* Fila 3: Terminal */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(139,92,246,0.1)', padding: '8px', borderRadius: '8px', color: '#8b5cf6' }}><CreditCard size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Ventas Terminal Bancaria</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total pagado con tarjeta (baucher)</div>
                  </div>
                </div>
                <div>
                  <input type="number" value={posTerminalSales} onChange={(e) => setPosTerminalSales(e.target.value)} className="neo-input" placeholder="0.00" style={{ width: '100%', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                </div>
              </div>

              {/* Fila 4: Foodbot Efectivo */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(245,158,11,0.1)', padding: '8px', borderRadius: '8px', color: '#f59e0b' }}><MonitorSmartphone size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Ventas Foodbot (Efectivo)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lo que el sistema registró en efectivo</div>
                  </div>
                </div>
                <div>
                  <input type="number" value={cashSales} onChange={(e) => setCashSales(e.target.value)} className="neo-input" placeholder="0.00" style={{ width: '100%', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                </div>
              </div>

              {/* Fila 5: Cash Ins */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(16,185,129,0.1)', padding: '8px', borderRadius: '8px', color: '#10b981' }}><Plus size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Entradas Extra (Cash Ins)</div>
                  </div>
                </div>
                <div>
                  <input type="number" value={cashIns} onChange={(e) => setCashIns(e.target.value)} className="neo-input" placeholder="0.00" style={{ width: '100%', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                </div>
              </div>

              {/* Fila 6: Cash Outs */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', alignItems: 'center', padding: '16px 24px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(239,68,68,0.1)', padding: '8px', borderRadius: '8px', color: '#ef4444' }}><ArrowUpRight size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Salidas Extra (Cash Outs)</div>
                  </div>
                </div>
                <div>
                  <input type="number" value={cashOuts} onChange={(e) => setCashOuts(e.target.value)} className="neo-input" placeholder="0.00" style={{ width: '100%', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                </div>
              </div>
            </div>

            {/* Retiros Extra */}
            <div style={{ marginTop: '8px', padding: '24px', background: 'var(--background-color)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Banknote size={20} style={{ color: 'var(--text-muted)' }} /> Retiros Manuales de Efectivo
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Registra compras de insumos o retiros del dueño con el dinero de la caja.</p>
                </div>
                <button onClick={addWithdrawal} className="neo-btn" style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--neo-shadow-sm)' }}>
                  <Plus size={16} /> Añadir Fila
                </button>
              </div>
              
              {withdrawals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', background: 'var(--surface-color)', borderRadius: '12px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>No hay retiros registrados hoy.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {withdrawals.map((w, index) => (
                    <div key={index} style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: '12px', boxShadow: 'var(--neo-shadow-sm)', border: '1px solid var(--border-color)' }}>
                      <input 
                        type="text" 
                        value={w.concept}
                        onChange={(e) => updateWithdrawal(index, 'concept', e.target.value)}
                        placeholder="Concepto (ej. Insumos, Garrafón)"
                        className="neo-input"
                        style={{ flex: 2, padding: '10px 12px', border: 'none', background: 'var(--background-color)', borderRadius: '8px', fontSize: '0.95rem' }}
                      />
                      <div style={{ flex: 1, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700 }}>$</span>
                        <input 
                          type="number" 
                          value={w.amount}
                          onChange={(e) => updateWithdrawal(index, 'amount', e.target.value)}
                          placeholder="Monto"
                          className="neo-input"
                          style={{ width: '100%', padding: '10px 12px 10px 24px', border: 'none', background: 'var(--background-color)', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', textAlign: 'right' }}
                        />
                      </div>
                      <button onClick={() => removeWithdrawal(index)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div style={{ padding: '24px 40px', background: 'rgba(255, 255, 255, 0.5)', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(10px)' }}>
            <button onClick={submitCut} className="neo-btn neo-btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem', fontWeight: 800, borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)' }}>
              Enviar Corte Definitivo
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
             <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
               <div style={{ overflowX: 'auto' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                   <thead>
                     <tr style={{ background: 'linear-gradient(90deg, rgba(37,99,235,0.05) 0%, rgba(139,92,246,0.05) 100%)', borderBottom: '2px solid var(--border-color)' }}>
                       <th style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>FECHA</th>
                       <th style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>VENTAS EFVO.</th>
                       <th style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>VENTAS TERM.</th>
                       <th style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--primary-color)', fontWeight: 800, letterSpacing: '0.5px' }}>VENTAS BRUTAS</th>
                       <th style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>TICKETS</th>
                       <th style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>TKT. PROM.</th>
                       <th style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>CAJA INICIAL</th>
                       <th style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>CAJA FINAL</th>
                       <th style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>RETIROS</th>
                     </tr>
                   </thead>
                   <tbody>
                     {closures.map((closure, idx) => {
                       const totalVentas = closure.cash_sales + closure.pos_terminal_sales;
                       const ticketPromedio = closure.total_tickets > 0 ? (totalVentas / closure.total_tickets).toFixed(2) : 0;
                       const rowBg = idx % 2 === 0 ? 'var(--background-color)' : 'white';
                       
                       return (
                         <tr key={closure.id} style={{ background: rowBg, borderBottom: '1px solid var(--border-color)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.03)'; }} onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}>
                           <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                               {closure.close_date}
                             </div>
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
                           <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                             <span style={{ color: 'var(--text-muted)', marginRight: '2px' }}>$</span>{ticketPromedio}
                           </td>
                           <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-muted)' }}>
                             ${closure.opening_cash?.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                           </td>
                           <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                             ${closure.declared_cash?.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                           </td>
                           <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                             <button className="neo-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--neo-shadow-sm)' }}>
                               Detalles
                             </button>
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
