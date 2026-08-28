import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Edit3, Check, X, PackageOpen, Wallet, FileText } from 'lucide-react';
import { PurchaseOrderModal } from '../components/PurchaseOrderModal';
import { PurchaseOrderHistory } from '../components/PurchaseOrderHistory';
import { ExpensesList } from '../components/ExpensesList';
import { AuthContext } from '../components/ProtectedRoute';

/* ════════════════════════════════════════════
   COMPRAS Y GASTOS - LISTA MAESTRA (RECUADRO AZUL)
   ════════════════════════════════════════════ */

export function Purchases() {
  const { isAdmin } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showPOModal, setShowPOModal] = useState(false);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'lista' : 'historial'); 
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);
  
  // Estado temporal para la edición
  const [tempCost, setTempCost] = useState('');
  const [tempItemsPerBox, setTempItemsPerBox] = useState('');
  const [tempBoxPrice, setTempBoxPrice] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Obtener los productos con sus unidades y categorías mediante JOIN
      const { data: prodData, error } = await supabase
        .from('products')
        .select(`
          id, name, 
          cost_price, items_per_box, box_price,
          unit:catalog_values!unit_id(name),
          category:catalog_values!category_id(name)
        `)
        .order('name');
        
      if (error) throw error;
      setProducts(prodData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (prod) => {
    setEditingId(prod.id);
    setTempCost(prod.cost_price || '');
    setTempItemsPerBox(prod.items_per_box || '');
    setTempBoxPrice(prod.box_price || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Cálculo automático si cambia el costo unitario o piezas por caja
  const handleCostChange = (val) => {
    setTempCost(val);
    if (val && tempItemsPerBox) {
      setTempBoxPrice((parseFloat(val) * parseInt(tempItemsPerBox)).toFixed(2));
    }
  };

  const handleItemsChange = (val) => {
    setTempItemsPerBox(val);
    if (val && tempCost) {
      setTempBoxPrice((parseFloat(tempCost) * parseInt(val)).toFixed(2));
    }
  };

  const saveEdit = async (id) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          cost_price: tempCost ? parseFloat(tempCost) : null,
          items_per_box: tempItemsPerBox ? parseInt(tempItemsPerBox) : null,
          box_price: tempBoxPrice ? parseFloat(tempBoxPrice) : null
        })
        .eq('id', id);

      if (error) throw error;
      
      // Actualizar estado local
      setProducts(products.map(p => 
        p.id === id 
          ? { ...p, cost_price: tempCost, items_per_box: tempItemsPerBox, box_price: tempBoxPrice } 
          : p
      ));
      setEditingId(null);
    } catch (err) {
      console.error('Error saving:', err);
      alert('Error al guardar los costos.');
    }
  };

  // Agrupar productos parseando el nombre (ya que las categorías de BD son muy genéricas como "Complemento")
  const groupedProducts = products.reduce((acc, p) => {
    let group = 'Otros';
    const lowerName = p.name.toLowerCase();
    
    if (lowerName.includes('original')) group = 'Bases Originales';
    else if (lowerName.includes('flat')) group = 'Bases Flat';
    else if (lowerName.includes('cobertura')) group = 'Coberturas';
    else if (lowerName.includes('relleno') || lowerName.includes('lechera') || lowerName.includes('nutella')) group = 'Rellenos';
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  // Orden de categorías deseado según el Excel
  const categoryOrder = ['Bases Originales', 'Bases Flat', 'Coberturas', 'Rellenos', 'Otros'];
  const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
    return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
  });

  return (
    <div className="neo-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 className="neo-title">Compras y Gastos</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de órdenes de compra y reporte de gastos diarios.</p>
        </div>
        {isAdmin && (
          <button 
            className="neo-btn neo-btn-primary" 
            onClick={() => setShowPOModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FileText size={20} />
            Generar Orden de Compra
          </button>
        )}
      </div>

      {/* Navegación por pestañas */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        {isAdmin && (
          <button 
            className={`neo-btn ${activeTab === 'lista' ? 'neo-btn-primary' : ''}`}
            onClick={() => setActiveTab('lista')}
            style={{ flex: 1, padding: '16px' }}
          >
            Lista Maestra de Precios
          </button>
        )}
        <button 
          className={`neo-btn ${activeTab === 'historial' ? 'neo-btn-primary' : ''}`}
          onClick={() => setActiveTab('historial')}
          style={{ flex: 1, padding: '16px' }}
        >
          Historial de Órdenes
        </button>
        <button 
          className={`neo-btn ${activeTab === 'gastos' ? 'neo-btn-primary' : ''}`}
          onClick={() => setActiveTab('gastos')}
          style={{ flex: 1, padding: '16px' }}
        >
          Registro de Gastos
        </button>
      </div>

      {showPOModal && (
        <PurchaseOrderModal 
           onClose={() => setShowPOModal(false)} 
           onSuccess={() => {
             setShowPOModal(false);
             setRefreshHistoryTrigger(prev => prev + 1);
             setActiveTab('historial');
           }}
        />
      )}

      {activeTab === 'historial' ? (
        <PurchaseOrderHistory refreshTrigger={refreshHistoryTrigger} />
      ) : activeTab === 'gastos' ? (
        <ExpensesList />
      ) : (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando precios...</div>
          ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {sortedCategories.map(cat => {
            if (!groupedProducts[cat] || groupedProducts[cat].length === 0) return null;
            return (
              <div key={cat} className="neo-surface" style={{ padding: '24px', borderRadius: '16px' }}>
                <h2 style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 800, 
                  color: 'var(--primary-color)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  <span style={{ 
                    width: '8px', 
                    height: '24px', 
                    background: 'var(--primary-color)', 
                    borderRadius: '4px' 
                  }}></span>
                  {cat}
                </h2>
                
                <div className="neo-table-container">
                  <table className="neo-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '35%', textAlign: 'left', padding: '16px' }}>CONCEPTO</th>
                        <th style={{ width: '20%', textAlign: 'center', padding: '16px' }}>UNITARIO (Base)</th>
                        <th style={{ width: '15%', textAlign: 'center', padding: '16px' }}>CONTENIDO / CAJA</th>
                        <th style={{ width: '20%', textAlign: 'center', padding: '16px' }}>COSTO CAJA ($)</th>
                        <th style={{ width: '10%', textAlign: 'center', padding: '16px' }}>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedProducts[cat].map(p => {
                        // Limpiar el nombre para que no repita la categoría (ej. "Cobertura Blanca" -> "Blanca")
                        let cleanName = p.name
                          .replace(/Original/gi, '')
                          .replace(/Flat/gi, '')
                          .replace(/Cobertura/gi, '')
                          .replace(/Relleno/gi, '')
                          .trim();
                        // Si se borró todo, usamos el nombre original
                        if (!cleanName) cleanName = p.name;

                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <td style={{ padding: '16px' }}>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                                {cleanName}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {p.name}
                              </div>
                            </td>
                            
                            {editingId === p.id ? (
                              <>
                                <td style={{ textAlign: 'center', padding: '16px' }}>
                                  <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>$</span>
                                    <input 
                                      type="number" 
                                      value={tempCost} 
                                      onChange={(e) => handleCostChange(e.target.value)}
                                      className="neo-input"
                                      style={{ width: '100px', padding: '8px 12px 8px 24px', textAlign: 'center', background: 'var(--background-color)' }}
                                    />
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center', padding: '16px' }}>
                                  <input 
                                    type="number" 
                                    value={tempItemsPerBox} 
                                    onChange={(e) => handleItemsChange(e.target.value)}
                                    className="neo-input"
                                    style={{ width: '80px', padding: '8px', textAlign: 'center', background: 'var(--background-color)' }}
                                    placeholder={cat.includes('Cobertura') || cat.includes('Relleno') ? 'N/A' : ''}
                                  />
                                </td>
                                <td style={{ textAlign: 'center', padding: '16px' }}>
                                  <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>$</span>
                                    <input 
                                      type="number" 
                                      value={tempBoxPrice} 
                                      onChange={(e) => setTempBoxPrice(e.target.value)}
                                      className="neo-input"
                                      style={{ width: '120px', padding: '8px 12px 8px 24px', textAlign: 'center', background: 'var(--background-color)' }}
                                    />
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center', padding: '16px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                    <button 
                                      onClick={() => saveEdit(p.id)} 
                                      className="neo-btn"
                                      style={{ padding: '8px', color: 'var(--status-ok)', minWidth: '40px' }}
                                      title="Guardar"
                                    >
                                      <Check size={18} strokeWidth={3} />
                                    </button>
                                    <button 
                                      onClick={cancelEdit} 
                                      className="neo-btn"
                                      style={{ padding: '8px', color: 'var(--status-danger)', minWidth: '40px' }}
                                      title="Cancelar"
                                    >
                                      <X size={18} strokeWidth={3} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{ textAlign: 'center', padding: '16px', fontSize: '1.05rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                  {(() => {
                                    if (p.cost_price) return `$ ${Number(p.cost_price).toFixed(2)}`;
                                    if (p.box_price && p.items_per_box) {
                                      const unitPrice = p.box_price / p.items_per_box;
                                      let suffix = 'pz';
                                      const lowerUnit = p.unit?.name?.toLowerCase() || '';
                                      if (lowerUnit.includes('mili')) suffix = 'ml';
                                      else if (lowerUnit.includes('gram')) suffix = 'g';
                                      
                                      return (
                                        <>
                                          $ {Number(unitPrice).toFixed(4)} <span style={{fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)'}}>/ {suffix}</span>
                                        </>
                                      );
                                    }
                                    return <span style={{color:'var(--text-muted)'}}>-</span>;
                                  })()}
                                </td>
                                <td style={{ textAlign: 'center', padding: '16px' }}>
                                  {p.items_per_box ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--background-color)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, boxShadow: 'var(--neo-shadow-inset)' }}>
                                      <PackageOpen size={16} style={{ color: 'var(--primary-color)' }} /> 
                                      {(() => {
                                        const lowerUnit = p.unit?.name?.toLowerCase() || '';
                                        if (lowerUnit.includes('mili')) return `${p.items_per_box / 1000} L`;
                                        if (lowerUnit.includes('gram')) return `${p.items_per_box / 1000} kg`;
                                        return `${p.items_per_box} pzas`;
                                      })()}
                                    </span>
                                  ) : <span style={{color:'var(--text-muted)'}}>-</span>}
                                </td>
                                <td style={{ textAlign: 'center', padding: '16px', fontSize: '1.1rem', fontWeight: p.box_price ? 800 : 'normal', color: p.box_price ? 'var(--status-ok)' : 'var(--text-muted)' }}>
                                  {p.box_price ? `$ ${Number(p.box_price).toFixed(2)}` : '-'}
                                </td>
                                <td style={{ textAlign: 'center', padding: '16px' }}>
                                  <button
                                    onClick={() => startEdit(p)}
                                    className="neo-btn"
                                    style={{ padding: '8px', minWidth: '40px' }}
                                    title="Editar Precios"
                                  >
                                    <Edit3 size={16} style={{ color: 'var(--text-muted)' }} />
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
          )}
        </>
      )}
    </div>
  );
}
