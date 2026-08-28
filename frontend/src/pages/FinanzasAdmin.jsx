import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { Banknote, Building2, Plus, Trash2, Settings, Percent, Save } from 'lucide-react';

export function FinanzasAdmin() {
  const { branches, activeBranch, setActiveBranch } = useBranchStore();
  const [loading, setLoading] = useState(false);
  const [savingCommission, setSavingCommission] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  
  const [commission, setCommission] = useState(2.5);
  
  const [configMonth, setConfigMonth] = useState(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [activeConfigTab, setActiveConfigTab] = useState('FIJOS'); // 'FIJOS' | 'NOMINA'
  const [fixedCosts, setFixedCosts] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [branchEmployees, setBranchEmployees] = useState([]);

  useEffect(() => {
    if (branches.length > 0 && !activeBranch) {
      setActiveBranch(branches[0]);
    }
  }, [branches, activeBranch, setActiveBranch]);

  useEffect(() => {
    if (activeBranch) {
      loadCommission();
      loadMonthlyConfig();
    }
  }, [activeBranch, configMonth]);

  const loadCommission = async () => {
    try {
      const { data: settingsData } = await supabase
        .from('branch_settings')
        .select('card_commission_percentage')
        .eq('branch_id', activeBranch.id)
        .maybeSingle();
      
      if (settingsData && settingsData.card_commission_percentage !== undefined) {
        setCommission(settingsData.card_commission_percentage);
      } else {
        setCommission(2.5); // Default
      }
    } catch (err) {
      console.error('Error cargando comisión:', err);
    }
  };

  const loadMonthlyConfig = async () => {
    setLoading(true);
    try {
      // 1. Fetch Fixed Costs
      const { data: fcData, error: fcError } = await supabase
        .from('branch_fixed_costs')
        .select('*')
        .eq('branch_id', activeBranch.id)
        .eq('month_year', configMonth);
        
      if (fcError && fcError.code !== 'PGRST205') throw fcError;
      setFixedCosts(fcData || []);

      // 2. Fetch Payroll
      const { data: pData, error: pError } = await supabase
        .from('branch_payroll')
        .select('*')
        .eq('branch_id', activeBranch.id)
        .eq('month_year', configMonth);
        
      if (pError && pError.code !== 'PGRST205') throw pError;
      setPayrollData(pData || []);

      // 3. Fetch Employees for dropdown
      const { data: empData, error: empError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, display_name')
        .eq('branch_id', activeBranch.id)
        .eq('is_active', true);
        
      if (!empError) {
        setBranchEmployees(empData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCommission = async () => {
    setSavingCommission(true);
    try {
      const orgId = activeBranch?.organization_id;
      if (!orgId) throw new Error("No se pudo determinar la organización de la sucursal.");

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

  const saveMonthlyConfig = async () => {
    setSavingConfig(true);
    try {
      const orgId = activeBranch?.organization_id;
      if (!orgId) throw new Error("No se pudo determinar la organización de la sucursal.");

      // Eliminar configuraciones antiguas para este mes y sucursal
      await Promise.all([
        supabase.from('branch_fixed_costs').delete().eq('branch_id', activeBranch.id).eq('month_year', configMonth),
        supabase.from('branch_payroll').delete().eq('branch_id', activeBranch.id).eq('month_year', configMonth)
      ]);

      // Insertar nuevos gastos fijos
      const validCosts = fixedCosts.filter(c => c.concept && c.amount).map(c => ({
        organization_id: orgId,
        branch_id: activeBranch.id,
        month_year: configMonth,
        category: c.category || 'OTROS',
        concept: c.concept,
        amount: parseFloat(c.amount)
      }));

      // Insertar nueva nómina
      const validPayroll = payrollData.filter(p => p.employee_id && p.employee_name && p.daily_rate && p.days_worked).map(p => {
        const rate = parseFloat(p.daily_rate) || 0;
        const days = parseFloat(p.days_worked) || 0;
        const bonuses = parseFloat(p.bonuses) || 0;
        const deductions = parseFloat(p.deductions) || 0;
        const total_to_pay = (rate * days) + (bonuses * 200) - deductions;
        
        return {
          branch_id: activeBranch.id,
          month_year: configMonth,
          employee_id: p.employee_id,
          employee_name: p.employee_name,
          daily_rate: rate,
          days_worked: days,
          bonuses: bonuses,
          deductions: deductions,
          total_to_pay: total_to_pay,
          bank_clabe: p.bank_clabe || '',
          bank_name: p.bank_name || ''
        };
      });

      const promises = [];
      if (validCosts.length > 0) promises.push(supabase.from('branch_fixed_costs').insert(validCosts));
      if (validPayroll.length > 0) promises.push(supabase.from('branch_payroll').insert(validPayroll));
      
      await Promise.all(promises);
      
      alert('Configuración mensual guardada correctamente.');
      loadMonthlyConfig();
    } catch (err) {
      console.error(err);
      alert('Error al guardar configuración: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const addFixedCostRow = () => {
    setFixedCosts([...fixedCosts, { id: Date.now().toString(), category: 'OTROS', concept: '', amount: '' }]);
  };

  const addPayrollRow = () => {
    setPayrollData([...payrollData, { id: Date.now().toString(), employee_id: '', employee_name: '', daily_rate: '', days_worked: '', bonuses: '', deductions: '', bank_clabe: '', bank_name: '' }]);
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

      {!activeBranch ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando datos...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', alignItems: 'start' }}>
          
          {/* COLUMNA 1: COMISIONES */}
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

          {/* COLUMNA 2: COSTOS FIJOS Y NÓMINAS */}
          <div className="neo-surface fade-in" style={{ padding: '24px', borderRadius: '20px', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Banknote size={20} color="var(--accent-color)" /> Gastos Mensuales (Fijos y Nóminas)
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Configura los gastos y nóminas para cada mes en particular.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Mes a configurar:</label>
              <input 
                type="month" 
                value={configMonth} 
                onChange={(e) => setConfigMonth(e.target.value)}
                className="neo-input"
                style={{ width: 'auto' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <button 
                onClick={() => setActiveConfigTab('FIJOS')}
                style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeConfigTab === 'FIJOS' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeConfigTab === 'FIJOS' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
              >Gastos Fijos</button>
              <button 
                onClick={() => setActiveConfigTab('NOMINA')}
                style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeConfigTab === 'NOMINA' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeConfigTab === 'NOMINA' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
              >Nóminas</button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando información del mes...</div>
            ) : (
              <>
                {activeConfigTab === 'FIJOS' && (
                  <div style={{ background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0 }}>Desglose de Costos Fijos</h3>
                      <button onClick={addFixedCostRow} className="neo-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }}><Plus size={16} /> Agregar Fila</button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {fixedCosts.map((cost, idx) => (
                        <div key={cost.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <select 
                            value={cost.category || 'OTROS'}
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
                            <option value="MANTENIMIENTO">Mantenimiento</option>
                            <option value="SEGUROS">Seguros</option>
                            <option value="IMPUESTOS">Impuestos</option>
                            <option value="OTROS">Otros Gastos Fijos</option>
                          </select>
                          
                          <input 
                            type="text"
                            placeholder="Concepto (ej. Renta Local 5)"
                            value={cost.concept || ''}
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
                            value={cost.amount || ''}
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
                )}

                {activeConfigTab === 'NOMINA' && (
                  <div style={{ background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0 }}>Desglose de Nómina Mensual</h3>
                      <button onClick={addPayrollRow} className="neo-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }}><Plus size={16} /> Agregar Empleado</button>
                    </div>
                    
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: 'rgba(37,99,235,0.05)' }}>
                            <th style={{ padding: '8px', textAlign: 'left' }}>N. Emp.</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Nombre</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>$/Día</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Días Lab.</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Bonos</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Desc. $</th>
                            <th style={{ padding: '8px', textAlign: 'right', color: 'var(--primary-color)' }}>Total a Pagar</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>CLABE</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Banco</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {payrollData.map((emp, idx) => {
                            const rate = parseFloat(emp.daily_rate) || 0;
                            const days = parseFloat(emp.days_worked) || 0;
                            const bonos = parseFloat(emp.bonuses) || 0;
                            const descuentos = parseFloat(emp.deductions) || 0;
                            const total = (rate * days) + (bonos * 200) - descuentos;

                            const updateField = (field, val) => {
                              const newData = [...payrollData];
                              newData[idx][field] = val;
                              setPayrollData(newData);
                            };

                            return (
                              <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '8px' }}>
                                <input type="text" className="neo-input" style={{ width: '60px', padding: '6px', background: '#f8fafc' }} value={emp.employee_id ? emp.employee_id.substring(0, 5) : ''} readOnly title={emp.employee_id || 'ID autogenerado'} />
                              </td>
                              <td style={{ padding: '8px', minWidth: '160px' }}>
                                <select 
                                  className="neo-input" 
                                  style={{ width: '100%', padding: '6px' }}
                                  value={emp.employee_id}
                                  onChange={e => {
                                    const selectedId = e.target.value;
                                    const selectedEmp = branchEmployees.find(b => b.id === selectedId);
                                    if (selectedEmp) {
                                      const fullName = `${selectedEmp.first_name || ''} ${selectedEmp.last_name || ''}`.trim() || selectedEmp.display_name;
                                      updateField('employee_id', selectedId);
                                      updateField('employee_name', fullName);
                                    } else {
                                      updateField('employee_id', '');
                                      updateField('employee_name', '');
                                    }
                                  }}
                                >
                                  <option value="">Seleccione...</option>
                                  {branchEmployees.map(b => {
                                    const name = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.display_name;
                                    return <option key={b.id} value={b.id}>{name}</option>
                                  })}
                                  {/* Si ya hay un empleado guardado que no está en la lista actual de activos */}
                                  {emp.employee_id && !branchEmployees.find(b => b.id === emp.employee_id) && (
                                    <option value={emp.employee_id}>{emp.employee_name}</option>
                                  )}
                                </select>
                              </td>
                              <td style={{ padding: '8px' }}><input type="number" className="neo-input" style={{ width: '70px', padding: '6px' }} value={emp.daily_rate || ''} onChange={e => updateField('daily_rate', e.target.value)} /></td>
                                <td style={{ padding: '8px' }}><input type="number" className="neo-input" style={{ width: '60px', padding: '6px' }} value={emp.days_worked || ''} onChange={e => updateField('days_worked', e.target.value)} /></td>
                                <td style={{ padding: '8px' }}><input type="number" className="neo-input" style={{ width: '60px', padding: '6px' }} value={emp.bonuses || ''} onChange={e => updateField('bonuses', e.target.value)} /></td>
                                <td style={{ padding: '8px' }}><input type="number" className="neo-input" style={{ width: '70px', padding: '6px' }} value={emp.deductions || ''} onChange={e => updateField('deductions', e.target.value)} /></td>
                                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-color)' }}>${total.toLocaleString('es-MX')}</td>
                                <td style={{ padding: '8px' }}><input type="text" className="neo-input" style={{ width: '120px', padding: '6px' }} value={emp.bank_clabe || ''} onChange={e => updateField('bank_clabe', e.target.value)} /></td>
                                <td style={{ padding: '8px' }}><input type="text" className="neo-input" style={{ width: '80px', padding: '6px' }} value={emp.bank_name || ''} onChange={e => updateField('bank_name', e.target.value)} /></td>
                                <td style={{ padding: '8px' }}>
                                  <button onClick={() => {
                                    const newData = [...payrollData];
                                    newData.splice(idx, 1);
                                    setPayrollData(newData);
                                  }} style={{ background: 'transparent', border: 'none', color: 'var(--status-danger)', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {payrollData.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '16px' }}>No hay nómina configurada para este mes.</p>}
                  </div>
                )}

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={saveMonthlyConfig}
                    disabled={savingConfig}
                    className="neo-btn neo-btn-primary" 
                    style={{ padding: '12px 24px', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Save size={20} />
                    {savingConfig ? 'Guardando...' : `Guardar Configuración de ${configMonth}`}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
