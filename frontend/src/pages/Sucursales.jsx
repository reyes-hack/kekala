import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { Plus, Store, MapPin, Phone, Hash, Edit2, CheckCircle2, XCircle, Building2, Map } from 'lucide-react';

export function Sucursales() {
  const { activeBranch, fetchBranches } = useBranchStore();
  const [branchesList, setBranchesList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    is_active: true
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('is_active', { ascending: false })
        .order('name');
      
      if (error) throw error;
      setBranchesList(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openModal = (branch = null) => {
    if (!branch && branchesList.length >= 2) {
      // LIMIT REACHED FOR NEW BRANCH
      setShowLicenseModal(true);
      return;
    }

    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name || '',
        code: branch.code || '',
        address: branch.address || '',
        city: branch.city || '',
        state: branch.state || '',
        phone: branch.phone || '',
        is_active: branch.is_active
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        code: '',
        address: '',
        city: '',
        state: '',
        phone: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBranch(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      alert('Nombre y Código son obligatorios');
      return;
    }

    setSaving(true);
    try {
      // Necesitamos organization_id. Usamos el de la sucursal activa, o buscamos uno si no hay.
      let orgId = activeBranch?.organization_id;
      if (!orgId) {
        const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
        if (orgs && orgs.length > 0) orgId = orgs[0].id;
      }

      const payload = {
        organization_id: orgId,
        name: formData.name,
        code: formData.code,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        phone: formData.phone,
        is_active: formData.is_active,
        country_code: 'MX'
      };

      if (editingBranch) {
        const { error } = await supabase
          .from('branches')
          .update(payload)
          .eq('id', editingBranch.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('branches')
          .insert([payload]);
        if (error) throw error;
      }

      await loadBranches();
      await fetchBranches(); // Refresca el store global (selector del sidebar)
      closeModal();
    } catch (error) {
      console.error('Error saving branch:', error);
      alert('Error guardando sucursal: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (branch) => {
    try {
      const { error } = await supabase
        .from('branches')
        .update({ is_active: !branch.is_active })
        .eq('id', branch.id);
      
      if (error) throw error;
      await loadBranches();
      await fetchBranches();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Error cambiando estado: ' + error.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '0 20px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           <div style={{ background: 'var(--accent-gradient)', padding: '12px', borderRadius: '16px', color: 'white', boxShadow: 'var(--neo-shadow-sm)' }}>
             <Building2 size={32} />
           </div>
           <div>
             <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 800 }}>Sucursales</h1>
             <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Administra tus ubicaciones y puntos de venta.</p>
           </div>
        </div>
        
        <button onClick={() => openModal()} className="neo-btn neo-btn-primary" style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Plus size={20} /> Añadir Sucursal
        </button>
      </div>

      {/* GRID DE SUCURSALES */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando sucursales...</div>
      ) : branchesList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>No hay sucursales creadas.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {branchesList.map(branch => (
            <div key={branch.id} className="neo-surface" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '16px', opacity: branch.is_active ? 1 : 0.6, transition: 'all 0.3s' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: branch.is_active ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)', padding: '10px', borderRadius: '12px', color: branch.is_active ? '#2ecc71' : '#e74c3c' }}>
                    <Store size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>{branch.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px' }}>{branch.code}</span>
                  </div>
                </div>
                <div 
                  onClick={() => toggleStatus(branch)}
                  title={branch.is_active ? "Desactivar sucursal" : "Activar sucursal"}
                  style={{ cursor: 'pointer', color: branch.is_active ? '#2ecc71' : '#e74c3c', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700, background: 'var(--background-color)', padding: '4px 10px', borderRadius: '20px' }}
                >
                  {branch.is_active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {branch.is_active ? 'Activa' : 'Inactiva'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                  <span>{branch.city ? `${branch.city}, ${branch.state}` : 'Ubicación no especificada'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <Map size={16} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{branch.address || 'Dirección no especificada'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                  <span>{branch.phone || 'Teléfono no registrado'}</span>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => openModal(branch)} className="neo-btn" style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit2 size={16} /> Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NUEVA/EDITAR SUCURSAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="neo-surface" style={{ width: '100%', maxWidth: '600px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ background: 'var(--color-secondary)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '12px' }}>
                  <Store size={24} />
                </div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                  {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
                </h2>
              </div>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '50%' }}>
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Nombre de la Sucursal <span style={{color: 'var(--status-danger)'}}>*</span>
                  </label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="neo-input" placeholder="Ej. El Dorado" style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--background-color)', border: '1px solid var(--border-color)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Hash size={16} style={{color: 'var(--primary-color)'}}/> Código Interno <span style={{color: 'var(--status-danger)'}}>*</span>
                  </label>
                  <input type="text" name="code" required value={formData.code} onChange={handleInputChange} className="neo-input" placeholder="Ej. ELD-01" style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--background-color)', border: '1px solid var(--border-color)', textTransform: 'uppercase' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Map size={16} style={{color: 'var(--primary-color)'}}/> Dirección Completa
                </label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="neo-input" placeholder="Calle, Número, Colonia" style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--background-color)', border: '1px solid var(--border-color)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Ciudad
                  </label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="neo-input" placeholder="Ej. Boca del Río" style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--background-color)', border: '1px solid var(--border-color)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Estado
                  </label>
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="neo-input" placeholder="Ej. Veracruz" style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--background-color)', border: '1px solid var(--border-color)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={16} style={{color: 'var(--primary-color)'}}/> Teléfono
                  </label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="neo-input" placeholder="(000) 000-0000" style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--background-color)', border: '1px solid var(--border-color)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '10px' }}>
                <button type="button" onClick={closeModal} className="neo-btn" style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="neo-btn neo-btn-primary" style={{ padding: '12px 32px', fontSize: '1rem', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {saving ? 'Guardando...' : (editingBranch ? 'Guardar Cambios' : 'Crear Sucursal')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {showLicenseModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '90%', maxWidth: '500px', padding: '0', overflow: 'hidden' }}>
            <div style={{ background: '#ef4444', padding: '32px', textAlign: 'center', color: 'white' }}>
              <Building2 size={64} style={{ margin: '0 auto 16px auto', opacity: 0.9 }} />
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>¡LÍMITE ALCANZADO!</h2>
              <p style={{ margin: '8px 0 0 0', fontSize: '1.1rem', opacity: 0.9 }}>Licencia Básica (Max. 2 Sucursales)</p>
            </div>
            
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '24px' }}>
                Tu plan actual solo te permite administrar un máximo de 2 sucursales simultáneas. Para registrar una tercera sucursal y seguir expandiendo tu negocio, necesitas aumentar tu plan.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button onClick={() => setShowLicenseModal(false)} className="neo-btn neo-btn-primary" style={{ padding: '16px', fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px', background: '#ef4444', color: 'white' }}>
                  Contactar a Soporte
                </button>
                <button onClick={() => setShowLicenseModal(false)} className="neo-btn" style={{ padding: '12px', fontSize: '1rem', fontWeight: 600 }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
