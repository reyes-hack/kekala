import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { AuthContext } from '../components/ProtectedRoute';
import { Building, Wallet, Landmark, ArrowRight, ArrowDownRight, ArrowUpRight, Plus, Download } from 'lucide-react';
import { NeoDatePicker } from '../components/NeoDatePicker';

export function SabanaFinanciera() {
  const { activeBranch } = useBranchStore();
  const { isAdmin, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState([]);
  
  // Modals for transfers
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [transferDate, setTransferDate] = useState(() => {
    const mxDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
    return [
      mxDate.getFullYear(),
      String(mxDate.getMonth() + 1).padStart(2, '0'),
      String(mxDate.getDate()).padStart(2, '0')
    ].join('-');
  });

  // Buckets
  const [cajaChicaBalance, setCajaChicaBalance] = useState(0);
  const [efectivoNetoBalance, setEfectivoNetoBalance] = useState(0);
  const [bancoBalance, setBancoBalance] = useState(0);

  useEffect(() => {
    if (activeBranch) {
      loadFinancialData();
    }
  }, [activeBranch]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Transfers
      const { data: transfersData } = await supabase
        .from('cash_transfers')
        .select('*')
        .eq('organization_id', activeBranch?.organization_id);

      // 2. Fetch Cash Closures for Branch Cash
      const { data: closuresData } = await supabase
        .from('cash_closures')
        .select('*')
        .eq('organization_id', activeBranch?.organization_id);
      
      // 3. Fetch Expenses for Branch Cash Output
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('organization_id', activeBranch?.organization_id);

      let totalCaja = 0;
      let totalEfectivo = 0;
      let totalBanco = 0;

      if (closuresData) {
        closuresData.forEach(c => {
          totalCaja += Number(c.cash_sales || 0);
          totalBanco += Number(c.pos_terminal_sales || 0); // Terminal goes to Bank
        });
      }
      
      if (expensesData) {
        expensesData.forEach(e => {
          totalCaja -= Number(e.amount || 0);
        });
      }

      if (transfersData) {
        transfersData.forEach(t => {
          if (t.transfer_type === 'BRANCH_TO_ADMIN') {
            totalCaja -= Number(t.amount);
            totalEfectivo += Number(t.amount);
          } else if (t.transfer_type === 'ADMIN_TO_BANK') {
            totalEfectivo -= Number(t.amount);
            totalBanco += Number(t.amount);
          }
        });
        
        setTransfers(transfersData.sort((a, b) => new Date(b.transfer_date) - new Date(a.transfer_date)));
      }

      setCajaChicaBalance(totalCaja);
      setEfectivoNetoBalance(totalEfectivo);
      setBancoBalance(totalBanco);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (type) => {
    if (!amount || Number(amount) <= 0) {
      alert("Ingresa un monto válido");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.from('cash_transfers').insert({
        organization_id: activeBranch.organization_id,
        branch_id: activeBranch.id,
        transfer_type: type,
        amount: Number(amount),
        transfer_date: transferDate,
        notes: notes,
        registered_by: user.id
      });
      
      if (error) throw error;
      
      alert("Transferencia registrada exitosamente");
      setShowWithdrawalModal(false);
      setShowDepositModal(false);
      setAmount('');
      setNotes('');
      loadFinancialData();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  if (!isAdmin) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Acceso denegado</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Landmark color="var(--primary-color)" /> Sábana Financiera
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Flujo de efectivo global: Sucursales, Caja Fuerte y Bancos.</p>
        </div>
      </div>

      {/* 3 Buckets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* Bucket 1: Caja Chica */}
        <div className="neo-surface" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(37,99,235,0.1)', padding: '12px', borderRadius: '12px', color: '#2563eb' }}>
              <Building size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Caja Chica (Sucursales)</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Efectivo físico en tienda</p>
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>
            {formatCurrency(cajaChicaBalance)}
          </div>
          <button onClick={() => setShowWithdrawalModal(true)} className="neo-btn" style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', gap: '8px', background: 'var(--background-color)', border: '1px dashed var(--border-color)' }}>
            <ArrowRight size={18} color="var(--primary-color)"/> Retirar a Efectivo Neto
          </button>
        </div>

        {/* Bucket 2: Efectivo Neto */}
        <div className="neo-surface" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '12px', color: '#10b981' }}>
              <Wallet size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Efectivo Neto (Admin)</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Efectivo físico en tu poder</p>
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>
            {formatCurrency(efectivoNetoBalance)}
          </div>
          <button onClick={() => setShowDepositModal(true)} className="neo-btn" style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', gap: '8px', background: 'var(--background-color)', border: '1px dashed var(--border-color)' }}>
            <ArrowRight size={18} color="#10b981"/> Depositar al Banco
          </button>
        </div>

        {/* Bucket 3: Banco */}
        <div className="neo-surface" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(245,158,11,0.1)', padding: '12px', borderRadius: '12px', color: '#f59e0b' }}>
              <Landmark size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Cuenta Ban Bajío</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Saldo en cuenta bancaria</p>
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>
            {formatCurrency(bancoBalance)}
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', padding: '12px', background: 'var(--background-color)', borderRadius: '12px' }}>
            Entradas por Terminal caen directo aquí.
          </div>
        </div>
      </div>

      {/* Historial de Movimientos */}
      <div className="neo-surface" style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Historial de Transferencias</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Fecha</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Movimiento</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Monto</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Notas</th>
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No hay transferencias registradas</td></tr>
              ) : (
                transfers.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 24px' }}>{t.transfer_date}</td>
                    <td style={{ padding: '16px 24px' }}>
                      {t.transfer_type === 'BRANCH_TO_ADMIN' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                          <ArrowRight size={14} /> Retiro de Sucursal
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                          <ArrowRight size={14} /> Depósito a Banco
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(t.amount)}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{t.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {(showWithdrawalModal || showDepositModal) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="neo-surface fade-in" style={{ width: '100%', maxWidth: '400px', padding: '32px', borderRadius: '24px' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.4rem' }}>
              {showWithdrawalModal ? 'Retirar de Sucursal' : 'Depositar a Banco'}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Fecha</label>
                <NeoDatePicker value={transferDate} onChange={setTransferDate} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Monto</label>
                <input type="number" className="neo-input" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '1.2rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Notas / Concepto</label>
                <input type="text" className="neo-input" placeholder="Ej. Retiro mediodía" value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', padding: '12px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setShowWithdrawalModal(false); setShowDepositModal(false); }} className="neo-btn" style={{ flex: 1, background: 'var(--background-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                Cancelar
              </button>
              <button onClick={() => handleTransfer(showWithdrawalModal ? 'BRANCH_TO_ADMIN' : 'ADMIN_TO_BANK')} className="neo-btn neo-btn-primary" style={{ flex: 1 }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
