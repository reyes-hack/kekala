import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

          <button 
            onClick={() => setActiveTab('sistema')}
            className={`neo-btn ${activeTab === 'sistema' ? 'active' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', background: activeTab === 'sistema' ? 'var(--accent-gradient)' : 'transparent', color: activeTab === 'sistema' ? 'var(--text-on-brand)' : 'var(--text-primary)', boxShadow: activeTab === 'sistema' ? 'var(--accent-glow)' : 'none', border: 'none' }}
          >
            <Settings size={18} /> Sistema
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1 }}>
          {activeTab === 'empleados' && <EmpleadosTab />}
          {activeTab === 'sucursales' && <div className="neo-surface" style={{ padding: '0 24px 24px 24px', borderRadius: '16px' }}><Sucursales /></div>}
          {activeTab === 'sistema' && <SistemaTab />}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PESTAÑA SISTEMA (FOODBOT Y CONFIGURACIONES GLOBALES)
// ----------------------------------------------------
function SistemaTab() {
  const [loading, setLoading] = useState(true);
  const [foodbotEnabled, setFoodbotEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'FOODBOT_SYNC_GLOBAL_ENABLED')
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setFoodbotEnabled(data.value === 'true' || data.value === true);
      }
    } catch (err) {
      console.error('Error loading system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFoodbot = async () => {
    setSaving(true);
    const newValue = !foodbotEnabled;
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key: 'FOODBOT_SYNC_GLOBAL_ENABLED', 
          value: newValue,
          description: 'Toggle to globally enable or disable the automated 4-hour Foodbot synchronization'
        }, { onConflict: 'key' });
        
      if (error) throw error;
      setFoodbotEnabled(newValue);
    } catch (err) {
      console.error('Error saving setting:', err);
      alert('Error al guardar configuración: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando configuraciones...</div>;
  }

  return (
    <div className="neo-surface fade-in" style={{ padding: '32px', borderRadius: '24px' }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: '1.8rem' }}>Configuración del Sistema</h2>
      
      <div style={{ background: 'var(--background-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            Sincronización Global de Foodbot
          </h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px' }}>
            Activa o desactiva la integración automática de Foodbot a nivel de toda la cadena. 
            Si esto se apaga, el sistema ignorará la sincronización en todas las sucursales.
          </p>
        </div>
        
        <div 
          onClick={saving ? null : toggleFoodbot}
          style={{ 
            width: '60px', height: '32px', borderRadius: '16px', 
            background: foodbotEnabled ? '#10b981' : 'var(--border-color)', 
            position: 'relative', cursor: saving ? 'wait' : 'pointer', transition: 'all 0.3s'
          }}
        >
          <div style={{ 
            width: '26px', height: '26px', borderRadius: '50%', background: 'white',
            position: 'absolute', top: '3px', left: foodbotEnabled ? '31px' : '3px',
            transition: 'all 0.3s', boxShadow: 'var(--neo-shadow-sm)'
          }} />
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
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdatePinOpen, setIsUpdatePinOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [formData, setFormData] = useState({ full_name: '', branch_id: '', role: 'CASHIER', pin_code: '' });
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      // Necesitamos cargar roles para mostrar "ADMIN" o "CASHIER"
      const { data, error } = await supabase.from('profiles')
        .select(`
          *, 
          branches(name),
          profile_roles(
            roles(code)
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error && error.code !== 'PGRST205') throw error;
      
      if (error?.code === 'PGRST205') {
         setEmployees([]);
      } else {
         const formatted = (data || []).map(emp => ({
           ...emp,
           displayName: emp.display_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Usuario Sin Nombre',
           role: emp.profile_roles?.[0]?.roles?.code || 'CASHIER'
         }));
         setEmployees(formatted);
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
      const { error } = await supabase.functions.invoke('crear_empleado_seguro', { body: formData });
      if (error) {
        alert(`Error al crear empleado: ${error.message || 'Error desconocido'}`);
      } else {
        setIsModalOpen(false);
        setFormData({ full_name: '', branch_id: '', role: 'CASHIER', pin_code: '' });
        loadEmployees();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePin = async (e) => {
    e.preventDefault();
    if (!newPin || newPin.length !== 6) {
      alert("El NIP debe ser exactamente de 6 dígitos.");
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('actualizar_pin_seguro', { 
        body: { target_user_id: selectedEmp.id, new_pin: newPin } 
      });
      if (error) {
        alert(`Error al actualizar NIP: ${error.message || 'Error desconocido'}`);
      } else {
        alert("NIP actualizado exitosamente.");
        setIsUpdatePinOpen(false);
        setNewPin('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('eliminar_empleado_seguro', { 
        body: { target_user_id: selectedEmp.id } 
      });
      if (error) {
        alert(`Error al eliminar empleado: ${error.message || 'Error desconocido'}`);
      } else {
        setIsDeleteOpen(false);
        loadEmployees();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="neo-surface fade-in" style={{ padding: '32px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, var(--accent-color) 0%, transparent 70%)', opacity: 0.1, borderRadius: '50%' }}></div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', letterSpacing: '-0.03em' }}>Directorio de Empleados</h2>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>Administra los accesos seguros a las sucursales.</p>
        </div>
        <button onClick={() => {
          setFormData({ full_name: '', branch_id: branches[0]?.id || '', role: 'CASHIER', pin_code: '' });
          setIsModalOpen(true);
        }} className="neo-btn neo-btn-primary" style={{ padding: '12px 24px', fontSize: '1rem', borderRadius: '16px' }}>
          <Plus size={20} /> Nuevo Empleado
        </button>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <table className="neo-table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', letterSpacing: '0.05em' }}>EMPLEADO</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', letterSpacing: '0.05em' }}>SUCURSAL</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', letterSpacing: '0.05em' }}>ROL</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', letterSpacing: '0.05em', textAlign: 'right' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} style={{ transition: 'all 0.2s', borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: 'var(--accent-glow)' }}>
                      {getInitials(emp.displayName)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>{emp.displayName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {emp.id.split('-')[0]}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Store size={14} opacity={0.6}/>
                    {emp.branches?.name || 'Acceso Global'}
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: '700',
                    letterSpacing: '0.05em',
                    background: emp.role === 'ADMIN' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: emp.role === 'ADMIN' ? '#2563eb' : '#10b981',
                    border: emp.role === 'ADMIN' ? '1px solid rgba(37,99,235,0.2)' : '1px solid rgba(16,185,129,0.2)'
                  }}>
                    {emp.role === 'ADMIN' ? 'ADMINISTRADOR' : 'CAJERO'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setSelectedEmp(emp); setIsUpdatePinOpen(true); }} className="neo-btn" style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'var(--bg-color)' }}>
                      Cambiar NIP
                    </button>
                    <button onClick={() => { setSelectedEmp(emp); setIsDeleteOpen(true); }} className="neo-btn" style={{ padding: '8px 16px', fontSize: '0.85rem', color: '#ef4444', borderColor: '#ef4444', background: 'transparent' }}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && !loading && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '64px 32px', color: 'var(--text-muted)' }}>
                  <Users size={48} opacity={0.2} style={{ marginBottom: '16px' }} />
                  <div>No hay empleados registrados.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL NUEVO EMPLEADO */}
      {isModalOpen && createPortal(
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="neo-surface slide-up" style={{ width: '100%', maxWidth: '450px', background: 'var(--bg-color)', borderRadius: '24px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.4rem' }}>
                <div style={{ background: 'var(--accent-gradient)', color: 'white', padding: '8px', borderRadius: '12px' }}><Users size={20}/></div>
                Nuevo Empleado
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Nombre Completo</label>
                <input required type="text" className="neo-input" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Ej. Juan Pérez" style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Rol del Sistema</label>
                <NeoSelect 
                  name="role"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  options={[
                    { value: 'CASHIER', label: 'Cajero (Solo sucursal asignada)' },
                    { value: 'ADMIN', label: 'Administrador General' }
                  ]}
                />
              </div>

              {formData.role !== 'ADMIN' && (
                <div className="fade-in">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Sucursal Asignada</label>
                  <NeoSelect 
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={e => setFormData({...formData, branch_id: e.target.value})}
                    options={branches.map(b => ({ value: b.id, label: b.name }))}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>NIP de Acceso (6 Dígitos)</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
                  <input required type="password" maxLength={6} pattern="\d{6}" className="neo-input" value={formData.pin_code} onChange={e => setFormData({...formData, pin_code: e.target.value.replace(/\D/g, '')})} placeholder="••••••" style={{ width: '100%', fontSize: '1.5rem', letterSpacing: '0.5em', textAlign: 'center', paddingLeft: '48px' }} />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <Shield size={14} style={{ flexShrink: 0, marginTop: '2px' }}/>
                  El empleado usará este código para entrar a la tablet. Se guardará de forma encriptada.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="neo-btn" style={{ flex: 1, padding: '14px' }}>Cancelar</button>
                <button type="submit" disabled={saving} className="neo-btn neo-btn-primary" style={{ flex: 1, padding: '14px' }}>{saving ? 'Guardando...' : 'Crear Empleado'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL CAMBIAR NIP */}
      {isUpdatePinOpen && selectedEmp && createPortal(
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="neo-surface slide-up" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-color)', borderRadius: '24px', padding: '32px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.3rem' }}>Actualizar NIP</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Estás por cambiar el NIP de <strong>{selectedEmp.displayName}</strong>.
            </p>
            <form onSubmit={handleUpdatePin}>
              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
                <input required type="password" maxLength={6} pattern="\d{6}" className="neo-input" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} placeholder="Nuevo NIP (6 dígitos)" style={{ width: '100%', fontSize: '1.2rem', letterSpacing: '0.2em', textAlign: 'center', paddingLeft: '48px' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setIsUpdatePinOpen(false)} className="neo-btn" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={saving || newPin.length !== 6} className="neo-btn neo-btn-primary" style={{ flex: 1 }}>{saving ? 'Actualizando...' : 'Actualizar'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL ELIMINAR EMPLEADO */}
      {isDeleteOpen && selectedEmp && createPortal(
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="neo-surface slide-up" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-color)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Users size={24} />
            </div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.3rem' }}>Revocar Acceso</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: 1.5 }}>
              ¿Estás seguro que deseas eliminar a <strong>{selectedEmp.displayName}</strong>? Esta acción es irreversible y eliminará su acceso al sistema inmediatamente.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setIsDeleteOpen(false)} className="neo-btn" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleDelete} disabled={saving} className="neo-btn" style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none' }}>{saving ? 'Eliminando...' : 'Sí, eliminar'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

