import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Save, Search, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export function Recetario() {
  const [mappings, setMappings] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Cargar mapeos actuales
      const { data: mappingsData } = await supabase
        .from('foodbot_mappings')
        .select('*')
        .order('foodbot_name', { ascending: true });

      // Cargar catálogo de productos para el dropdown
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, product_code, unit_id')
        .order('name', { ascending: true });

      setMappings(mappingsData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching recetario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMapping = () => {
    setMappings([
      { id: `temp-${Date.now()}`, foodbot_name: '', product_id: '', deduction_quantity: 0.05, is_active: true, isNew: true },
      ...mappings
    ]);
  };

  const handleUpdateRow = (id, field, value) => {
    setMappings(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleDelete = async (id, isNew) => {
    if (isNew) {
      setMappings(prev => prev.filter(m => m.id !== id));
      return;
    }
    
    if(window.confirm('¿Eliminar esta equivalencia?')) {
        await supabase.from('foodbot_mappings').delete().eq('id', id);
        fetchData();
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const payload = mappings.map(m => ({
        ...(m.isNew ? {} : { id: m.id }),
        foodbot_name: m.foodbot_name,
        product_id: m.product_id,
        deduction_quantity: parseFloat(m.deduction_quantity),
        is_active: m.is_active
      }));

      // Basic validation
      if(payload.some(p => !p.foodbot_name || !p.product_id || isNaN(p.deduction_quantity))) {
        alert("Por favor completa todos los campos (Nombre, Producto y Gasto)");
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('foodbot_mappings').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Hubo un error al guardar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredMappings = mappings.filter(m => 
    m.foodbot_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in delay-1">
      <div className="page-header">
        <div>
          <h1>Recetario (BOM Foodbot)</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Mapea los nombres de Foodbot con tus productos y define su gasto por unidad (litros/piezas).
          </p>
        </div>
        <div className="page-header-actions">
          <button onClick={handleAddMapping} className="neo-btn">
            <Plus size={18} /> Agregar Regla
          </button>
          <button onClick={handleSave} disabled={saving} className="neo-btn neo-btn-primary">
            {saving ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
          </button>
        </div>
      </div>

      {showSuccess && (
        <div className="neo-surface" style={{ padding: '16px', marginBottom: '20px', borderLeft: '4px solid var(--status-ok)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-ok)', fontWeight: 'bold' }}>
          <CheckCircle2 size={20} /> Cambios guardados exitosamente.
        </div>
      )}

      <div className="neo-surface" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar modificador..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Nombre exacto en Foodbot</th>
                <th>Producto del Inventario</th>
                <th>Gasto por Unidad (Ej. 0.05)</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', opacity: 0.5 }}>Cargando...</td></tr>
              ) : filteredMappings.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', opacity: 0.5 }}>No hay reglas definidas. Agrega una nueva.</td></tr>
              ) : (
                filteredMappings.map((mapping) => (
                  <tr key={mapping.id}>
                    <td>
                      <input 
                        type="text" 
                        value={mapping.foodbot_name} 
                        onChange={e => handleUpdateRow(mapping.id, 'foodbot_name', e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'var(--bg-color)', borderRadius: 'var(--radius-sm)', outline: 'none', color: 'var(--text-primary)', boxShadow: 'var(--neo-shadow-inset)' }}
                        placeholder="Ej. Relleno Pistache"
                      />
                    </td>
                    <td>
                      <select 
                        value={mapping.product_id}
                        onChange={e => handleUpdateRow(mapping.id, 'product_id', e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'var(--bg-color)', borderRadius: 'var(--radius-sm)', outline: 'none', color: 'var(--text-primary)', boxShadow: 'var(--neo-shadow-inset)', cursor: 'pointer' }}
                      >
                        <option value="">-- Selecciona un Producto --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>[{p.product_code}] {p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.0001"
                        value={mapping.deduction_quantity} 
                        onChange={e => handleUpdateRow(mapping.id, 'deduction_quantity', e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'var(--bg-color)', borderRadius: 'var(--radius-sm)', outline: 'none', color: 'var(--text-primary)', boxShadow: 'var(--neo-shadow-inset)' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDelete(mapping.id, mapping.isNew)} 
                        className="neo-btn" 
                        style={{ color: 'var(--status-danger)', padding: '8px' }}
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
