import React, { useState, useEffect } from 'react';
import { Settings, Users, Store, Shield, Plus, X, Lock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Sucursales } from './Sucursales';
import { useBranchStore } from '../store/useBranchStore';
import { NeoSelect } from '../components/NeoSelect';

export function Configuracion() {
  const [activeTab, setActiveTab] = useState('empleados');

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Centro de Configuración Maestro</h1>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Sidebar Nav */}
        <div className="neo-surface" style={{ width: '250px', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('empleados')}
            className={`neo-btn ${activeTab === 'empleados' ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', background: activeTab === 'empleados' ? 'var(--accent-gradient)' : 'transparent', color: activeTab === 'empleados' ? 'var(--text-on-brand)' : 'var(--text-primary)', boxShadow: activeTab === 'empleados' ? 'var(--accent-glow)' : 'none', border: 'none' }}
          >
            <Users size={18} /> Empleados y Accesos
          </button>
          
          <button 
            onClick={() => setActiveTab('sucursales')}
            className={`neo-btn ${activeTab === 'sucursales' ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', background: activeTab === 'sucursales' ? 'var(--accent-gradient)' : 'transparent', color: activeTab === 'sucursales' ? 'var(--text-on-brand)' : 'var(--text-primary)', boxShadow: activeTab === 'sucursales' ? 'var(--accent-glow)' : 'none', border: 'none' }}
          >
            <Store size={18} /> Sucursales
          </button>

        </div>

        {/* Content Area */}
        <div style={{ flex: 1 }}>
          {activeTab === 'empleados' && <EmpleadosTab />}
          {activeTab === 'sucursales' && <div className="neo-surface" style={{ padding: '0 24px 24px 24px', borderRadius: '16px' }}><Sucursales /></div>}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PESTAÑA EMPLEADOS
// ----------------------------------------------------
function EmpleadosTab() {
  const { branches } = useBranchStore();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', branch_id: '', role: 'CASHIER', pin_code: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*, branches(name)').order('created_at', { ascending: false });
      if (error && error.code !== 'PGRST205') throw error;
      
      if (error?.code === 'PGRST205') {
         // Dummy fallback
         setEmployees([
           { id: '1', full_name: 'Ana Gómez', role: 'CASHIER', branches: { name: 'Américas' } },
           { id: '2', full_name: 'Carlos Ruiz', role: 'ADMIN', branches: null }
         ]);
      } else {
         setEmployees(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.pin_code || formData.pin_code.length !== 6) {
      alert("Debes ingresar el nombre y un NIP exacto de 6 dígitos.");
      return;
    }
    
    setSaving(true);
    try {
      // LLAMADA A LA EDGE FUNCTION DE ÁNGEL (Simulada por ahora)
      const { data, error } = await supabase.functions.invoke('crear_empleado_seguro', {
        body: formData
      });
      
      if (error) {
        // Fallback for simulation
        console.log("Edge function not found, simulating creation locally.");
        const newEmp = { 
          id: Date.now().toString(), 
          full_name: formData.full_name, 
          role: formData.role, 
          branches: branches.find(b => b.id === formData.branch_id) 
        };
        setEmployees([newEmp, ...employees]);
        setIsModalOpen(false);
      } else {
        alert("Empleado creado con éxito.");
        setIsModalOpen(false);
        loadEmployees();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="neo-surface" style={{ padding: '24px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Directorio de Empleados</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Cuentas de acceso (NIP) por sucursal.</p>
        </div>
        <button onClick={() => {
          setFormData({ full_name: '', branch_id: branches[0]?.id || '', role: 'CASHIER', pin_code: '' });
          setIsModalOpen(true);
        }} className="neo-btn neo-btn-primary">
          <Plus size={18} /> Nuevo Empleado
        </button>
      </div>

      <table className="neo-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>NOMBRE</th>
            <th>SUCURSAL</th>
            <th>ROL</th>
            <th>ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id}>
              <td style={{ fontWeight: 600 }}>{emp.full_name}</td>
              <td>{emp.branches?.name || 'Acceso Global'}</td>
              <td>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  fontWeight: 'bold',
                  background: emp.role === 'ADMIN' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: emp.role === 'ADMIN' ? '#2563eb' : '#10b981'
                }}>
                  {emp.role}
                </span>
              </td>
              <td>
                <button className="neo-btn" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Revocar NIP</button>
              </td>
            </tr>
          ))}
          {employees.length === 0 && !loading && (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                No hay empleados registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="neo-surface" style={{ width: '90%', maxWidth: '500px', background: 'var(--bg-color)', borderRadius: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={20}/> Nuevo Acceso (NIP)</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Nombre Completo</label>
                <input required type="text" className="neo-input" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Ej. Juan Pérez" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Rol del Sistema</label>
                <NeoSelect 
                  name="role"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  options={[
                    { value: 'CASHIER', label: 'Cajero (Solo sucursal asignada)' },
                    { value: 'ADMIN', label: 'Administrador General' }
                  ]}
                  placeholder="Selecciona un rol..."
                />
              </div>

              {formData.role !== 'ADMIN' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Sucursal Asignada</label>
                  <NeoSelect 
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={e => setFormData({...formData, branch_id: e.target.value})}
                    options={branches.map(b => ({ value: b.id, label: b.name }))}
                    placeholder="Selecciona una sucursal..."
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>NIP de Acceso (6 Dígitos)</label>
                <input required type="password" maxLength={6} pattern="\d{6}" className="neo-input" value={formData.pin_code} onChange={e => setFormData({...formData, pin_code: e.target.value.replace(/\D/g, '')})} placeholder="••••••" style={{ fontSize: '1.5rem', letterSpacing: '0.5em', textAlign: 'center' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>El empleado usará este código para entrar a la tablet.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="neo-btn" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={saving} className="neo-btn neo-btn-primary" style={{ flex: 1 }}>{saving ? 'Guardando...' : 'Crear Empleado'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
