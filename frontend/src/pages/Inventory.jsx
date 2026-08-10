import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Warehouse, Loader2, RefreshCw, X, Play, Store, ChevronLeft, ChevronRight, Edit2, Check, CheckSquare, Edit3, ArrowDownUp, History, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';

import { useNeoFilters } from '../hooks/useNeoFilters';
import { NeoAdvancedFilter } from '../components/NeoAdvancedFilter';
import { NeoPagination } from '../components/NeoPagination';

export function Inventory() {
  const { activeBranch } = useBranchStore();
  const [inventoryList, setInventoryList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showValuationModal, setShowValuationModal] = useState(false);

  // Reemplazamos los estados sueltos por el hook maestro
  const {
    page, pageSize, globalSearch, advancedFilters,
    setPage, setPageSize, setGlobalSearch, applyAdvancedFilter, clearFilters
  } = useNeoFilters({ initialPageSize: 10 });

  // Alias para mantener legibilidad en lógica interna
  const selectedCategory = advancedFilters.category || '';
  const selectedStatus = advancedFilters.status || 'todos';

  // Estados para edición de stock mínimo
  const [editingProductId, setEditingProductId] = useState(null);
  const [tempMinStock, setTempMinStock] = useState('');

  // Estados para modales de Ajuste e Historial
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [historyProduct, setHistoryProduct] = useState(null);
  
  // Estados para Editar Producto Maestro
  const [productToEdit, setProductToEdit] = useState(null);

  const [totalCount, setTotalCount] = useState(0);

  // Evitar la primera ejecución doble en StrictMode
  const isInitialMount = useRef(true);

  // Efecto para búsqueda, filtros y cambio de sucursal con Debounce unificado
  useEffect(() => {
    if (!activeBranch) return;

    const delayDebounceFn = setTimeout(() => {
      loadData(page);
    }, isInitialMount.current ? 0 : 300);

    isInitialMount.current = false;

    return () => clearTimeout(delayDebounceFn);
  }, [globalSearch, selectedCategory, selectedStatus, activeBranch, page, pageSize]);

  // Carga catálogos estáticos una sola vez al montar
  useEffect(() => {
    async function loadCatalogs() {
      const { data: cats } = await supabase.from('catalog_values').select('id, name').eq('catalog_type_id', '7854e94c-288f-4d81-87e6-f34718f83c41');
      setCategories(cats || []);
      const { data: uns } = await supabase.from('catalog_values').select('id, name').eq('catalog_type_id', '3a3f0c50-fa65-4219-b1b4-065703e92ca0');
      setUnits(uns || []);
    }
    loadCatalogs();
  }, []);

  const [totalInitialized, setTotalInitialized] = useState(0);

  // Carga de datos optimizada con filtros integrados
  async function loadData(targetPage = page) {
    if (!activeBranch) return;
    setLoading(true);
    try {
      // 1. Obtener productos de branch_inventory para filtrar por estado de stock
      const { data: invData, error: invErr } = await supabase
        .from('branch_inventory')
        .select('product_id, current_stock, minimum_stock')
        .eq('branch_id', activeBranch.id);

      if (invErr) throw invErr;

      setTotalInitialized(invData?.length || 0);

      let matchingProductIds = null;

      // Filtrar IDs en base al estado de stock seleccionado
      if (selectedStatus !== 'todos') {
        const filtered = (invData || []).filter(item => {
          const current = parseFloat(item.current_stock) || 0;
          const min = parseFloat(item.minimum_stock) || 0;

          if (selectedStatus === 'optimo') {
            return current > min;
          } else if (selectedStatus === 'bajo') {
            return current <= min && current > 0;
          } else if (selectedStatus === 'agotado') {
            return current === 0;
          }
          return true;
        });

        matchingProductIds = filtered.map(f => f.product_id);
      }

      // 2. Construir consulta para la tabla de productos maestro
      let query = supabase
        .from('products')
        .select(`
          id, product_code, name, is_active, cost_price, box_price, items_per_box,
          category:category_id(id, name),
          unit:unit_id(id, name),
          branch_inventory (
            id, current_stock, minimum_stock
          )
        `, { count: 'exact' })
        .eq('is_active', true)
        .eq('branch_inventory.branch_id', activeBranch.id);

      // Aplicar filtro de categoría
      if (selectedCategory !== '') {
        query = query.eq('category_id', selectedCategory);
      }

      // Aplicar búsqueda por texto
      if (globalSearch && globalSearch.trim() !== '') {
        query = query.or(`name.ilike.%${globalSearch}%,product_code.ilike.%${globalSearch}%`);
      }

      // Aplicar filtro de estado de stock en base a los IDs filtrados
      if (selectedStatus !== 'todos') {
        if (!matchingProductIds || matchingProductIds.length === 0) {
          setInventoryList([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
        query = query.in('id', matchingProductIds);
      }

      const from = (targetPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('name')
        .range(from, to);

      if (error) throw error;
      
      setInventoryList(data || []);
      setTotalCount(count || 0);

    } catch (err) {
      console.error('Error cargando datos:', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function inicializarInventario(productId) {
    setInitLoading(productId);
    try {
      const { error } = await supabase.from('branch_inventory').insert({
        organization_id: activeBranch.organization_id,
        branch_id: activeBranch.id,
        product_id: productId,
        current_stock: 0,
        minimum_stock: 0,
        is_active: true
      });

      if (error) {
        alert('Error al inicializar: ' + error.message);
      } else {
        await loadData(page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInitLoading(null);
    }
  }

  // Guardar nuevo stock mínimo
  async function guardarStockMinimo(branchInventoryId) {
    const minVal = parseFloat(tempMinStock);
    if (isNaN(minVal) || minVal < 0) {
      alert('Introduce un número válido igual o mayor a 0.');
      return;
    }

    try {
      const { error } = await supabase
        .from('branch_inventory')
        .update({ minimum_stock: minVal })
        .eq('id', branchInventoryId);

      if (error) throw error;

      setEditingProductId(null);
      await loadData(page);
    } catch (err) {
      console.error('Error actualizando stock mínimo:', err.message);
      alert('Error al guardar: ' + err.message);
    }
  }

  return (
    <>
      <div className="page-header animate-in">
        <h1>Inventario: {activeBranch ? activeBranch.name : 'Seleccione Sucursal'}</h1>
        <div className="page-header-actions">
          <button className="neo-btn" onClick={() => setShowValuationModal(true)} title="Ver Valorización" disabled={!activeBranch}>
            <DollarSign size={18} /> Valorización
          </button>
          <button className="neo-btn" onClick={() => loadData(page)} title="Recargar" disabled={!activeBranch}>
            <RefreshCw size={18} />
          </button>
          <button className="neo-btn-primary neo-btn" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Panel de Filtros Inteligentes */}
      {activeBranch && (
        <div style={{ marginBottom: '24px' }}>
          <NeoAdvancedFilter 
            globalSearch={globalSearch}
            onSearchChange={setGlobalSearch}
            filters={advancedFilters}
            onFilterApply={applyAdvancedFilter}
            onClearFilters={clearFilters}
            filterConfig={[
              { id: 'category', label: 'Categoría', type: 'select', options: categories.map(c => ({val: c.id, label: c.name})) },
              { id: 'status', label: 'Estado de Stock', type: 'select', options: [
                {val: 'todos', label: 'Todos'},
                {val: 'optimo', label: 'Óptimo'},
                {val: 'bajo', label: 'Bajo Stock'},
                {val: 'agotado', label: 'Agotado'}
              ]}
            ]}
          />
        </div>
      )}

      <div className="stats-row animate-in delay-1">
        <div className="stat-card neo-surface">
          <span className="stat-label">Catálogo Maestro</span>
          <span className="stat-value">{totalCount}</span>
          <span className="stat-sub">productos globales</span>
        </div>
        <div className="stat-card neo-surface">
          <span className="stat-label">Iniciados en Sucursal</span>
          <span className="stat-value" style={{ color: 'var(--color-secondary)' }}>{totalInitialized}</span>
          <span className="stat-sub">listos para operar</span>
        </div>
        <div className="stat-card neo-surface">
          <span className="stat-label">Por Iniciar</span>
          <span className="stat-value" style={{ color: 'var(--status-warn)' }}>
            {Math.max(0, totalCount - totalInitialized)}
          </span>
          <span className="stat-sub">pendientes de inicializar</span>
        </div>
      </div>

      <div className="inventory-table-container animate-in delay-2">
        {loading ? (
          <div className="empty-state">
            <Loader2 size={40} className="spin" />
            <h3>Cargando inventario...</h3>
          </div>
        ) : !activeBranch ? (
          <div className="empty-state">
            <Store size={56} strokeWidth={1.5} />
            <h3>Sin sucursal activa</h3>
            <p>Seleccione una sucursal en el menú lateral para ver su inventario.</p>
          </div>
        ) : inventoryList.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Código</th>
                    <th>Categoría</th>
                    <th>Stock Actual</th>
                    <th>Mínimo (Alerta)</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryList.map(p => {
                    const isInitialized = p.branch_inventory && p.branch_inventory.length > 0;
                    const inv = isInitialized ? p.branch_inventory[0] : null;

                    let statusClass = 'warn';
                    let statusText = 'Pendiente';
                    if (isInitialized) {
                      if (inv.current_stock > inv.minimum_stock) { statusClass = 'ok'; statusText = 'Óptimo'; }
                      else if (inv.current_stock === 0) { statusClass = 'danger'; statusText = 'Agotado'; }
                      else { statusClass = 'warn'; statusText = 'Bajo'; }
                    }

                    return (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.product_code}</td>
                        <td>{p.category?.name || '—'}</td>
                        
                        {isInitialized ? (
                          <>
                            <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                              {(() => {
                                const lowerUnit = p.unit?.name?.toLowerCase() || '';
                                if (lowerUnit.includes('mili')) {
                                  return (
                                    <>
                                      {(inv.current_stock / 1000).toFixed(2).replace(/\.?0+$/, '')} <span style={{fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)'}}>L (aprox)</span>
                                    </>
                                  );
                                }
                                if (lowerUnit.includes('gram')) {
                                  return (
                                    <>
                                      {(inv.current_stock / 1000).toFixed(2).replace(/\.?0+$/, '')} <span style={{fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)'}}>kg (aprox)</span>
                                    </>
                                  );
                                }
                                return (
                                  <>
                                    {inv.current_stock} <span style={{fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)'}}>{p.unit?.name}</span>
                                  </>
                                );
                              })()}
                            </td>
                            <td>
                              {editingProductId === p.id ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <input
                                    type="number"
                                    value={tempMinStock}
                                    onChange={(e) => setTempMinStock(e.target.value)}
                                    style={{
                                      width: '60px',
                                      padding: '4px 6px',
                                      border: 'none',
                                      borderRadius: '4px',
                                      background: 'var(--surface-color)',
                                      boxShadow: 'var(--neo-shadow-inset)',
                                      outline: 'none',
                                      fontWeight: 600,
                                      color: 'var(--text-primary)'
                                    }}
                                  />
                                  <button
                                    onClick={() => guardarStockMinimo(inv.id)}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--status-ok)', padding: '2px' }}
                                    title="Guardar"
                                  >
                                    <Check size={16} strokeWidth={3} />
                                  </button>
                                  <button
                                    onClick={() => setEditingProductId(null)}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--status-danger)', padding: '2px' }}
                                    title="Cancelar"
                                  >
                                    <X size={16} strokeWidth={3} />
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span>
                                    {(() => {
                                      const lowerUnit = p.unit?.name?.toLowerCase() || '';
                                      if (lowerUnit.includes('mili') || lowerUnit.includes('gram')) {
                                        return (inv.minimum_stock / 1000).toFixed(2).replace(/\.?0+$/, '');
                                      }
                                      return inv.minimum_stock;
                                    })()}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingProductId(p.id);
                                      setTempMinStock(inv.minimum_stock);
                                    }}
                                    style={{
                                      border: 'none',
                                      background: 'none',
                                      cursor: 'pointer',
                                      color: 'var(--text-muted)',
                                      padding: '4px',
                                      borderRadius: '4px',
                                      transition: 'color var(--transition-fast)'
                                    }}
                                    className="edit-btn-hover"
                                    title="Editar límite de alerta"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                </div>

                              )}
                            </td>
                            <td><span className={`stock-badge ${statusClass}`}>● {statusText}</span></td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  className="neo-btn"
                                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                  onClick={() => setProductToEdit(p)}
                                  title="Editar Producto"
                                >
                                  <Edit2 size={14} style={{ color: 'var(--color-secondary)' }} />
                                </button>
                                <button
                                  className="neo-btn"
                                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                  onClick={() => setAdjustingProduct({ ...p, branch_inventory_id: inv.id, current_stock: inv.current_stock })}
                                  title="Ajustar Stock"
                                >
                                  <ArrowDownUp size={14} style={{ color: 'var(--color-secondary)' }} />
                                </button>
                                <button
                                  className="neo-btn"
                                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                  onClick={() => setHistoryProduct(p)}
                                  title="Ver Historial (Kárdex)"
                                >
                                  <History size={14} style={{ color: 'var(--color-secondary)' }} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <td colSpan="4">
                            <button 
                              className="neo-btn" 
                              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                              onClick={() => inicializarInventario(p.id)}
                              disabled={initLoading === p.id}
                            >
                              {initLoading === p.id ? <Loader2 size={14} className="spin" /> : <Play size={14} style={{ color: 'var(--color-secondary)' }} />}
                              &nbsp;Inicializar Inventario
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <NeoPagination 
              currentPage={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        ) : (
          <div className="empty-state">
            <Warehouse size={56} strokeWidth={1.5} />
            <h3>Sin productos registrados</h3>
            <p>Agrega tu primer producto global para inicializarlo aquí.</p>
          </div>
        )}
      </div>

      {showModal && (
        <NuevoProductoModal
          categories={categories}
          units={units}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadData(page); }}
        />
      )}

      {showValuationModal && activeBranch && (
        <ValuationModal 
          branchId={activeBranch.id} 
          branchName={activeBranch.name} 
          onClose={() => setShowValuationModal(false)} 
        />
      )}

      {adjustingProduct && (
        <AjustarStockModal
          product={adjustingProduct}
          activeBranch={activeBranch}
          onClose={() => setAdjustingProduct(null)}
          onSaved={() => { setAdjustingProduct(null); loadData(page); }}
        />
      )}

      {historyProduct && (
        <HistorialMovimientosModal
          product={historyProduct}
          activeBranch={activeBranch}
          onClose={() => setHistoryProduct(null)}
        />
      )}

      {productToEdit && (
        <EditProductoModal
          product={productToEdit}
          categories={categories}
          units={units}
          onClose={() => setProductToEdit(null)}
          onSaved={() => {
            setProductToEdit(null);
            loadData();
          }}
        />
      )}
    </>
  );
}

function NuevoProductoModal({ categories, units, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ product_code: '', name: '', category_id: '', unit_id: '', cost_price: '', box_price: '', items_per_box: '' });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.product_code || !form.name || !form.category_id || !form.unit_id) return setError('Faltan campos obligatorios.');

    setSaving(true);
    try {
      const { error: insertErr } = await supabase.from('products').insert({
        product_code: form.product_code.toUpperCase().replace(/\s/g, '_'),
        name: form.name,
        category_id: form.category_id,
        unit_id: form.unit_id,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        box_price: form.box_price ? Number(form.box_price) : null,
        items_per_box: form.items_per_box ? Number(form.items_per_box) : null,
      });

      if (insertErr) throw insertErr;
      onSaved();
    } catch (err) {
      setError(err.message.includes('uq_products') ? 'Ya existe el código.' : err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nuevo Producto Maestro</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        {error && <div style={{ color: 'var(--status-danger)', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Código *</label><input type="text" name="product_code" value={form.product_code} onChange={handleChange} /></div>
          <div className="form-group"><label>Nombre *</label><input type="text" name="name" value={form.name} onChange={handleChange} /></div>
          <div className="form-group">
            <label>Categoría *</label>
            <select name="category_id" value={form.category_id} onChange={handleChange}>
              <option value="">Seleccionar...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Unidad *</label>
            <select name="unit_id" value={form.unit_id} onChange={handleChange}>
              <option value="">Seleccionar...</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <label>Precio Unitario Directo (Opcional)</label>
            <input type="number" step="0.01" name="cost_price" value={form.cost_price} onChange={handleChange} placeholder="Ej. 15.50" />
            <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Usar para productos que se compran por pieza (ej. Bases).</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
            <div className="form-group">
              <label>Precio de Presentación (Caja/Cubeta)</label>
              <input type="number" step="0.01" name="box_price" value={form.box_price} onChange={handleChange} placeholder="Ej. 490" />
            </div>
            <div className="form-group">
              <label>Contenido por Presentación</label>
              <input type="number" step="1" name="items_per_box" value={form.items_per_box} onChange={handleChange} placeholder="Ej. 5000 (ml/g/pz)" />
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="neo-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="neo-btn neo-btn-primary">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditProductoModal({ product, categories, units, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ 
    product_code: product.product_code || '', 
    name: product.name || '', 
    category_id: product.category?.id || '', 
    unit_id: product.unit?.id || '',
    cost_price: product.cost_price || '',
    box_price: product.box_price || '',
    items_per_box: product.items_per_box || ''
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.product_code || !form.name || !form.category_id || !form.unit_id) return setError('Faltan campos obligatorios.');

    setSaving(true);
    try {
      const { error: updateErr } = await supabase.from('products').update({
        product_code: form.product_code.toUpperCase().replace(/\s/g, '_'),
        name: form.name,
        category_id: form.category_id,
        unit_id: form.unit_id,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        box_price: form.box_price ? Number(form.box_price) : null,
        items_per_box: form.items_per_box ? Number(form.items_per_box) : null,
      }).eq('id', product.id);

      if (updateErr) throw updateErr;
      onSaved();
    } catch (err) {
      setError(err.message.includes('uq_products') ? 'Ya existe el código.' : err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Producto Maestro</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        {error && <div style={{ color: 'var(--status-danger)', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Código *</label><input type="text" name="product_code" value={form.product_code} onChange={handleChange} /></div>
          <div className="form-group"><label>Nombre *</label><input type="text" name="name" value={form.name} onChange={handleChange} /></div>
          <div className="form-group">
            <label>Categoría *</label>
            <select name="category_id" value={form.category_id} onChange={handleChange}>
              <option value="">Seleccionar...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Unidad *</label>
            <select name="unit_id" value={form.unit_id} onChange={handleChange}>
              <option value="">Seleccionar...</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <label>Precio Unitario Directo (Opcional)</label>
            <input type="number" step="0.01" name="cost_price" value={form.cost_price} onChange={handleChange} placeholder="Ej. 15.50" />
            <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Usar para productos que se compran por pieza (ej. Bases).</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
            <div className="form-group">
              <label>Precio de Presentación (Caja/Cubeta)</label>
              <input type="number" step="0.01" name="box_price" value={form.box_price} onChange={handleChange} placeholder="Ej. 490" />
            </div>
            <div className="form-group">
              <label>Contenido por Presentación</label>
              <input type="number" step="1" name="items_per_box" value={form.items_per_box} onChange={handleChange} placeholder="Ej. 5000 (ml/g/pz)" />
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="neo-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="neo-btn neo-btn-primary">{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── MODAL AJUSTAR STOCK ─── */
function AjustarStockModal({ product, activeBranch, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [type, setType] = useState('entrada'); // 'entrada' o 'salida'
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Por favor ingresa una cantidad válida mayor a 0.');
      return;
    }

    setSaving(true);
    try {
      const finalQty = type === 'entrada' ? qty : -qty;

      // Movimiento tipo ADJUSTMENT en el catálogo
      const movementTypeId = '7d9cc151-6aba-4545-ac53-17362d02293e'; 

      const { error: insertErr } = await supabase.from('inventory_movements').insert({
        organization_id: activeBranch.organization_id,
        branch_id: activeBranch.id,
        product_id: product.id,
        movement_type_id: movementTypeId,
        quantity: finalQty,
        notes: notes || 'Ajuste manual de inventario'
      });

      if (insertErr) throw insertErr;
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ajustar Stock</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{product.name}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Stock Actual: <strong>{product.current_stock}</strong></p>
        </div>

        {error && <div style={{ color: 'var(--status-danger)', marginBottom: '1rem', fontWeight: 500 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tipo de Ajuste</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="entrada">Entrada (+)</option>
              <option value="salida">Salida (-)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Cantidad (Piezas) *</label>
            <input
              type="number"
              placeholder="Ej. 10"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              min="1"
            />
          </div>

          <div className="form-group">
            <label>Notas / Razón del Ajuste</label>
            <input
              type="text"
              placeholder="Ej. Corrección por conteo físico"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="neo-btn" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="neo-btn neo-btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Aplicar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── MODAL KÁRDEX / HISTORIAL DE MOVIMIENTOS ─── */
function HistorialMovimientosModal({ product, activeBranch, onClose }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('inventory_movements')
          .select(`
            id, quantity, previous_stock, current_stock, notes, created_at,
            type:movement_type_id(id, name, code)
          `)
          .eq('product_id', product.id)
          .eq('branch_id', activeBranch.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMovements(data || []);
      } catch (err) {
        console.error('Error cargando historial:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [product.id, activeBranch.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Historial de Movimientos (Kárdex)</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(26,79,153,0.06)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{product.name}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Código: <strong>{product.product_code}</strong></p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 size={32} className="spin" style={{ color: 'var(--color-secondary)' }} />
          </div>
        ) : movements.length > 0 ? (
          <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {movements.map((m, idx) => {
                const date = new Date(m.created_at).toLocaleString();
                const isPositive = m.quantity > 0;
                
                return (
                  <div key={m.id} className="neo-surface-inset" style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                        {m.type?.name || 'Movimiento'}
                      </span>
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: isPositive ? 'var(--status-ok)' : 'var(--status-danger)'
                      }}>
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>Flujo: {m.previous_stock ?? 0} → {m.current_stock ?? 0} piezas</span>
                      <span>{date}</span>
                    </div>

                    {m.notes && (
                      <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                        borderTop: '1px solid rgba(26,79,153,0.04)',
                        paddingTop: '0.25rem',
                        marginTop: '0.25rem'
                      }}>
                        Nota: {m.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <Warehouse size={40} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <p>No se encontraron movimientos registrados para este producto.</p>
          </div>
        )}

        <div className="form-actions" style={{ marginTop: '1.5rem' }}>
          <button type="button" className="neo-btn neo-btn-primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: ValuationModal
// ==========================================
function ValuationModal({ branchId, branchName, onClose }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchValuation() {
      try {
        const { data: valData, error } = await supabase.rpc('get_inventory_valuation', { p_branch_id: branchId });
        if (error) throw error;
        
        setData(valData || []);
        const t = (valData || []).reduce((acc, row) => acc + Number(row.total_value), 0);
        setTotal(t);
      } catch (err) {
        console.error('Error fetching valuation:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchValuation();
  }, [branchId]);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Valorización de Inventario</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 500 }}>
          {branchName}
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Loader2 size={40} className="spin" style={{ color: 'var(--color-secondary)' }} />
          </div>
        ) : (
          <>
            <div className="stat-card neo-surface" style={{ marginBottom: '1.5rem', background: 'var(--accent-gradient)' }}>
              <span className="stat-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Gran Total Invertido</span>
              <span className="stat-value" style={{ color: '#fff', fontSize: '2.5rem' }}>
                ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {data.map((row, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '1rem', 
                  borderBottom: '1px solid rgba(26, 79, 153, 0.1)',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{row.product_name}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {row.category_name} | {Number(row.current_stock).toLocaleString('es-MX', { maximumFractionDigits: 2 })} {row.unit_name} x ${Number(row.cost_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                    ${Number(row.total_value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {data.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                  No hay productos valorizables en esta sucursal.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

