import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { Banknote, Building2, Plus, Trash2, Settings, Percent } from 'lucide-react';
import { NeoSelect } from '../components/NeoSelect';

export function FinanzasAdmin() {
  const { branches, activeBranch, setActiveBranch } = useBranchStore();
  const [loading, setLoading] = useState(false);
  const [fixedCosts, setFixedCosts] = useState([]);
  const [commission, setCommission] = useState(2.5);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ category: 'RENTA', concept: '', amount: '' });
  const [savingCost, setSavingCost] = useState(false);
  const [savingCommission, setSavingCommission] = useState(false);

  const CATEGORIES = ['RENTA', 'NOMINA', 'SERVICIOS', 'MARKETING', 'MANTENIMIENTO', 'SEGUROS', 'IMPUESTOS', 'OTROS'];

  useEffect(() => {
    if (branches.length > 0 && !activeBranch) {
      setActiveBranch(branches[0]);
    }
  }, [branches, activeBranch, setActiveBranch]);

  useEffect(() => {
    if (activeBranch) {
      loadFinancialData();
    }
  }, [activeBranch]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      // 1. Cargar comisiones
      const { data: settingsData } = await supabase
        .from('branch_settings')
        .select('card_commission_percentage')
        .eq('branch_id', activeBranch.id)
        .single();
      
      if (settingsData && settingsData.card_commission_percentage !== undefined) {
        setCommission(settingsData.card_commission_percentage);
      } else {
        setCommission(2.5); // Default
      }

      // 2. Cargar costos fijos recurrentes
      const { data: costsData, error: costsError } = await supabase
        .from('branch_fixed_costs')
        .select('*')
        .eq('branch_id', activeBranch.id)
        .order('created_at', { ascending: true });
        
      if (costsError) throw costsError;
      setFixedCosts(costsData || []);

    } catch (err) {
      console.error('Error cargando datos financieros:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCommission = async () => {
    setSavingCommission(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const orgId = session.user.user_metadata?.organization_id;

      await supabase
        .from('branch_settings')
        .upsert({
          organization_id: orgId,
          branch_id: activeBranch.id,
          card_commission_percentage: parseFloat(commission) || 0
        }, { onConflict: 'branch_id' });
        
      alert('Comisión actualizada correctamente.');
    } catch (err) {
      alert('Error guardando comisión: ' + err.message);
    } finally {
      setSavingCommission(false);
    }
  };

  const handleAddCost = async (e) => {
    e.preventDefault();
    setSavingCost(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const orgId = session.user.user_metadata?.organization_id;

      const payload = {
        organization_id: orgId,
        branch_id: activeBranch.id,
        category: formData.category,
        concept: formData.concept,
        amount: parseFloat(formData.amount)
      };

      const { error } = await supabase.from('branch_fixed_costs').insert([payload]);
      if (error) throw error;

      setShowAddModal(false);
      setFormData({ category: 'RENTA', concept: '', amount: '' });
      loadFinancialData();
    } catch (err) {
      alert('Error agregando costo: ' + err.message);
    } finally {
      setSavingCost(false);
    }
  };

  const handleDeleteCost = async (id) => {
    if (!window.confirm('¿Eliminar este costo fijo recurrente?')) return;
    try {
      const { error } = await supabase.from('branch_fixed_costs').delete().eq('id', id);
      if (error) throw error;
      loadFinancialData();
    } catch (err) {
      alert('Error eliminando: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           <div style={{ background: 'var(--accent-gradient)', padding: '12px', borderRadius: '16px', color: 'white', boxShadow: 'var(--neo-shadow-sm)' }}>
             <Settings size={32} />
           </div>
           <div>
             <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 800 }}>Configuración Financiera</h1>
             <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Administra costos fijos recurrentes y comisiones.</p>
           </div>
        </div>
      </div>

      {/* SELECTOR SUCURSAL */}
      <div className="neo-surface" style={{ padding: '24px', borderRadius: '20px', position: 'relative', zIndex: 10 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={20} color="var(--accent-color)" /> Selecciona la Sucursal
        </h3>
        <div style={{ maxWidth: '400px' }}>
          <NeoSelect 
            options={branches.map(b => ({ value: b.id, label: b.name }))}
            value={activeBranch?.id || ''}
            onChange={(val) => setActiveBranch(branches.find(b => b.id === val))}
            placeholder="Seleccionar Sucursal"
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando datos...</div>
      ) : activeBranch && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', alignItems: 'start' }}>
          
          {/* COMISIONES BANCARIAS */}
          <div className="neo-surface fade-in" style={{ padding: '24px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Percent size={20} color="var(--accent-color)" /> Comisión Bancaria
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Porcentaje aplicado a las ventas con terminal para calcular el gasto financiero mensual.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" step="0.1" min="0" max="100"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  className="neo-input"
                  style={{ padding: '12px 16px', paddingRight: '32px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', fontWeight: 700, width: '100%', fontSize: '1.2rem', color: 'var(--text-primary)' }}
                />
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.2rem' }}>%</span>
              </div>
              
              <button 
                onClick={handleSaveCommission}
                disabled={savingCommission}
                className="neo-btn neo-btn-primary" 
                style={{ padding: '12px', fontWeight: 700, borderRadius: '12px', width: '100%', display: 'flex', justifyContent: 'center' }}
              >
                {savingCommission ? 'Guardando...' : 'Guardar Comisión'}
              </button>
            </div>
          </div>

          {/* COSTOS FIJOS RECURRENTES */}
          <div className="neo-surface fade-in" style={{ padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Banknote size={20} color="var(--accent-color)" /> Costos Fijos Recurrentes
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Estos costos se restarán automáticamente del P&L todos los meses.
                </p>
              </div>
              <button onClick={() => setShowAddModal(true)} className="neo-btn" style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Agregar
              </button>
            </div>

            {fixedCosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                No hay costos fijos recurrentes configurados.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {fixedCosts.map(cost => (
                  <div key={cost.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', color: 'var(--accent-color)', background: 'var(--accent-color-light)', padding: '4px 8px', borderRadius: '6px' }}>
                        {cost.category}
                      </span>
                      <p style={{ margin: '8px 0 0 0', fontWeight: 600, color: 'var(--text-primary)' }}>{cost.concept}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                        ${Number(cost.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                      <button onClick={() => handleDeleteCost(cost.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAL AGREGAR COSTO */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0 }}>Nuevo Costo Fijo</h2>
            <form onSubmit={handleAddCost} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Categoría</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="neo-input" 
                  style={{ width: '100%', padding: '12px', borderRadius: '10px' }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Concepto (Ej. Sueldo Gerente)</label>
                <input 
                  type="text" required 
                  value={formData.concept} 
                  onChange={e => setFormData({ ...formData, concept: e.target.value })}
                  className="neo-input" 
                  style={{ width: '100%', padding: '12px', borderRadius: '10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Monto Mensual ($)</label>
                <input 
                  type="number" step="0.01" min="0" required 
                  value={formData.amount} 
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="neo-input" 
                  style={{ width: '100%', padding: '12px', borderRadius: '10px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="neo-btn" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={savingCost} className="neo-btn neo-btn-primary" style={{ flex: 1 }}>
                  {savingCost ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
