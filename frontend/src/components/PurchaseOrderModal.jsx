import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, FileText, Download, FileSpreadsheet, Calculator, Check, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { exportToPDF, exportToExcelWithStyles } from '../utils/exportUtils';
import { NeoSelect } from './NeoSelect';

export function PurchaseOrderModal({ onClose, onSuccess, viewOrder }) {
  const { activeBranch } = useBranchStore();
  const [loading, setLoading] = useState(!viewOrder);
  const [inventoryData, setInventoryData] = useState([]);
  const [orderState, setOrderState] = useState(viewOrder ? (viewOrder.order_data.orderState || {}) : {}); 
  const [mode, setMode] = useState('limpia'); 
  
  // Custom Fields
  const [otros, setOtros] = useState(viewOrder ? (viewOrder.order_data.otros || []) : []);
  const [kits, setKits] = useState(viewOrder ? (viewOrder.order_data.kits || []) : []);
  const [observaciones, setObservaciones] = useState(viewOrder ? (viewOrder.order_data.observaciones || '') : '');

  const [allBranches, setAllBranches] = useState(viewOrder ? [{id: viewOrder.branch_id, name: 'Historial'}] : []);
  const [selectedBranchId, setSelectedBranchId] = useState(viewOrder ? viewOrder.branch_id : null);

  useEffect(() => {
    if (viewOrder) return;
    const loadBranches = async () => {
      const { data } = await supabase.from('branches').select('id, name').order('name');
      setAllBranches(data || []);
      if (activeBranch) {
        setSelectedBranchId(activeBranch.id);
      } else if (data && data.length > 0) {
        setSelectedBranchId(data[0].id);
      }
    };
    loadBranches();
  }, [activeBranch, viewOrder]);

  useEffect(() => {
    if (selectedBranchId && !viewOrder) {
      fetchInventory(selectedBranchId);
    }
  }, [selectedBranchId, viewOrder]);

  const fetchInventory = async (branchId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('branch_inventory')
        .select(`
          current_stock, minimum_stock,
          product:products (
            id, name, items_per_box
          )
        `)
        .eq('branch_id', branchId);

      if (error) throw error;
      setInventoryData(data || []);
      calculatePO('limpia', data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePO = (selectedMode, data = inventoryData) => {
    setMode(selectedMode);
    const newOrder = {};

    data.forEach(inv => {
      const p = inv.product;
      if (!p) return;

      const lowerName = p.name.toLowerCase();
      const isBase = lowerName.includes('original') || lowerName.includes('flat');
      
      let target = 0;
      if (selectedMode === 'minimo') {
        target = inv.minimum_stock || 0;
      } else if (selectedMode === 'sugerido') {
        target = Math.ceil((inv.minimum_stock || 0) * 1.15); 
      }

      let diff = target - (inv.current_stock || 0);
      let orderQty = 0;

      if (diff > 0) {
        if (isBase) {
          const perBox = p.items_per_box || 1;
          orderQty = Math.ceil(diff / perBox); 
        } else {
          orderQty = Math.ceil(diff / 1000); 
        }
      }

      newOrder[p.id] = orderQty;
    });

    setOrderState(newOrder);
  };

  const handleQtyChange = (productId, val) => {
    setOrderState(prev => ({
      ...prev,
      [productId]: parseInt(val) || 0
    }));
  };

  const handleAddOtro = () => {
    setOtros([...otros, { category: '', product: '', quantity: '' }]);
  };
  const handleUpdateOtro = (idx, field, val) => {
    const newOtros = [...otros];
    newOtros[idx][field] = val;
    setOtros(newOtros);
  };
  const handleRemoveOtro = (idx) => {
    setOtros(otros.filter((_, i) => i !== idx));
  };

  const handleAddKit = () => {
    setKits([...kits, { product: '', quantity: '' }]);
  };
  const handleUpdateKit = (idx, field, val) => {
    const newKits = [...kits];
    newKits[idx][field] = val;
    setKits(newKits);
  };
  const handleRemoveKit = (idx) => {
    setKits(kits.filter((_, i) => i !== idx));
  };

  const currentBranch = allBranches.find(b => b.id === selectedBranchId) || {};

  const groupedProducts = viewOrder 
    ? {
        'Bases Originales': viewOrder.order_data.basesOrig || [],
        'Bases Flat': viewOrder.order_data.basesFlat || [],
        'Coberturas': viewOrder.order_data.coberturas || [],
        'Rellenos': viewOrder.order_data.rellenos || []
      }
    : inventoryData.reduce((acc, inv) => {
        const p = inv.product;
        if (!p) return acc;
        
        let group = 'OtrosProductos';
        const lowerName = p.name.toLowerCase();
        
        if (lowerName.includes('original')) group = 'Bases Originales';
        else if (lowerName.includes('flat')) group = 'Bases Flat';
        else if (lowerName.includes('cobertura')) group = 'Coberturas';
        else if (lowerName.includes('relleno') || lowerName.includes('lechera') || lowerName.includes('nutella')) group = 'Rellenos';
        
        if (!acc[group]) acc[group] = [];
        acc[group].push(inv);
        return acc;
      }, {});

  const handleExportExcel = () => {
    const excelData = {
      branchName: currentBranch.name || 'Sucursal',
      date: new Date().toLocaleDateString('es-MX', {day: '2-digit', month: '2-digit', year: '2-digit'}),
      basesOrig: groupedProducts['Bases Originales'] || [],
      basesFlat: groupedProducts['Bases Flat'] || [],
      coberturas: groupedProducts['Coberturas'] || [],
      rellenos: groupedProducts['Rellenos'] || [],
      orderState,
      otros,
      kits,
      observaciones
    };
    exportToExcelWithStyles(excelData, `Orden_Compra_${currentBranch.name || 'Sucursal'}.xlsx`);
  };

  const handleConfirmOrder = async () => {
    if (!window.confirm("🚨 ¡ATENCIÓN! 🚨\n\n¿Seguro que checaste bien los números?\nUna vez confirmada, esta orden de compra quedará registrada oficialmente en el historial y no podrás modificarla.")) {
      return;
    }

    try {
      const orderData = {
        basesOrig: groupedProducts['Bases Originales'] || [],
        basesFlat: groupedProducts['Bases Flat'] || [],
        coberturas: groupedProducts['Coberturas'] || [],
        rellenos: groupedProducts['Rellenos'] || [],
        orderState,
        otros,
        kits,
        observaciones
      };

      const { error } = await supabase
        .from('purchase_orders')
        .insert({
          branch_id: selectedBranchId,
          status: 'ENVIADA',
          order_data: orderData
        });

      if (error) throw error;

      alert("✅ Orden de Compra guardada y enviada correctamente.");
      handleExportExcel(); 
      if (onSuccess) onSuccess();
      else onClose(); 
    } catch (err) {
      console.error("Error registrando orden:", err);
      alert("Hubo un error al guardar la orden de compra.");
    }
  };

  const renderTableSection = (title, items, isBase) => {
    if (!items || items.length === 0) return null;
    let totalBases = 0;

    return (
      <div style={{ flex: '1 1 45%', minWidth: '300px', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000' }} className="po-table">
          <thead>
            <tr>
              <th colSpan={isBase ? 4 : 2} style={{ background: '#3b82f6', color: 'white', padding: '8px', border: '1px solid #000', fontSize: '14px' }}>
                {title.toUpperCase()} KEKALA
              </th>
            </tr>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>PRODUCTO</th>
              {isBase ? (
                <>
                  <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px', width: '80px' }}>BASES POR CAJA</th>
                  <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px', width: '80px' }}>NO. CAJAS</th>
                  <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px', width: '80px' }}>TOTAL BASES</th>
                </>
              ) : (
                <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px', width: '100px' }}>CANTIDAD (LITROS)</th>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map(inv => {
              const p = inv.product;
              let cleanName = p.name.replace(/Original|Flat|Cobertura|Relleno/gi, '').trim();
              if (!cleanName) cleanName = p.name;
              
              const qty = orderState[p.id] || 0;
              const perBox = p.items_per_box || 0;
              const totalRowBases = isBase ? (qty * perBox) : 0;
              if (isBase) totalBases += totalRowBases;

              return (
                <tr key={p.id}>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', fontSize: '12px' }}>{cleanName.toUpperCase()}</td>
                  {isBase ? (
                    <>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontSize: '12px' }}>{perBox}</td>
                      <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                        <input 
                          type="number" 
                          value={qty === 0 ? '' : qty} 
                          onChange={(e) => handleQtyChange(p.id, e.target.value)}
                          disabled={!!viewOrder}
                          style={{ width: '100%', border: 'none', textAlign: 'center', background: 'transparent', outline: 'none', fontSize: '12px' }}
                          placeholder="0"
                        />
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontSize: '12px' }}>{totalRowBases}</td>
                    </>
                  ) : (
                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                      <input 
                        type="number" 
                        value={qty === 0 ? '' : qty} 
                        onChange={(e) => handleQtyChange(p.id, e.target.value)}
                        disabled={!!viewOrder}
                        style={{ width: '100%', border: 'none', textAlign: 'center', background: 'transparent', outline: 'none', fontSize: '12px' }}
                        placeholder="0"
                      />
                    </td>
                  )}
                </tr>
              );
            })}
            
            {isBase && (
              <tr>
                <td colSpan="2" style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>TOTAL</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                  {items.reduce((sum, inv) => sum + (orderState[inv.product.id] || 0), 0)}
                </td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                  {totalBases}
                </td>
              </tr>
            )}
            {!isBase && (
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>TOTAL</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                  {items.reduce((sum, inv) => sum + (orderState[inv.product.id] || 0), 0)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '96%', maxWidth: '1200px', height: '90vh', display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.88)', backdropFilter: 'saturate(200%) blur(32px)', border: '1.5px solid rgba(255, 255, 255, 0.95)', borderRadius: '28px', boxShadow: '0 30px 70px rgba(15, 39, 71, 0.25)' }}>
        <header className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Generar Orden de Compra</h2>
            <NeoSelect 
              name="branchSelect"
              value={selectedBranchId || ''} 
              onChange={(e) => setSelectedBranchId(e.target.value)}
              options={allBranches.map(b => ({ value: b.id, label: b.name }))}
              placeholder="Seleccionar Sucursal"
              style={{ width: '250px' }}
            />
          </div>
          <button onClick={onClose} className="modal-close"><X size={20} /></button>
        </header>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontWeight: 600 }}>Cargando inventario...</div>
          ) : (
            <>
              {/* Controles Superiores */}
              <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '20px' }}>
                {viewOrder ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <FileText size={20} />
                    <span>Visualizando Orden del Historial</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255, 255, 255, 0.5)', padding: '10px 18px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.7)' }}>
                    <Calculator style={{ color: '#1a4f99' }} />
                    <div>
                      <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Modo de Cálculo Automático:</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => calculatePO('limpia')} className={`glass-btn ${mode === 'limpia' ? 'neo-btn-primary' : ''}`} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Limpia (0)</button>
                        <button onClick={() => calculatePO('minimo')} className={`glass-btn ${mode === 'minimo' ? 'neo-btn-primary' : ''}`} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Stock Mínimo</button>
                        <button onClick={() => calculatePO('sugerido')} className={`glass-btn ${mode === 'sugerido' ? 'neo-btn-primary' : ''}`} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Sugerido (+15%)</button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => exportToPDF('po-export-area', `Orden_Compra_${currentBranch?.name || 'Sucursal'}.pdf`)}
                    className="glass-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    title="Exportar a PDF"
                  >
                    <Download size={18} /> PDF
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="glass-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}
                    title="Descargar versión Excel"
                  >
                    <FileSpreadsheet size={18} /> EXCEL
                  </button>
                  {!viewOrder && (
                    <button
                      onClick={handleConfirmOrder}
                      className="neo-btn neo-btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}
                    >
                      <Check size={18} /> Confirmar Orden
                    </button>
                  )}
                </div>
              </div>

              {/* Área de Impresión / Previsualización */}
              <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '20px' }}>
                <div 
                  id="po-export-area" 
                  style={{ 
                    minWidth: '950px',
                    background: 'white', 
                    padding: '40px', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: 'black',
                    fontFamily: 'Arial, sans-serif'
                  }}
                >
                {/* MATRIZ MAESTRA EN FORMATO TABLA PARA COMPATIBILIDAD CON EXCEL Y PDF */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td colSpan="2" style={{ paddingBottom: '20px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              <td rowSpan="4" style={{ width: '30%', textAlign: 'center', padding: '10px', verticalAlign: 'middle' }}>
                                <img src="/logo.png" alt="Kekala Custom Paleta" style={{ width: '250px', maxWidth: '100%', objectFit: 'contain' }} />
                              </td>
                              <td colSpan="3" style={{ height: '30px', background: '#fef08a', textAlign: 'center', fontWeight: 'bold', border: '2px solid #000', padding: '4px', fontSize: '14px' }}>
                                SOLICITUD DE ORDEN DE COMPRA
                              </td>
                            </tr>
                            <tr>
                              <td style={{ height: '24px', border: '1px solid #000', padding: '4px 6px', fontWeight: 'bold', fontSize: '12px' }}>FRANQUICIATARIO</td>
                              <td colSpan="2" style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', fontSize: '12px' }}>YUNMAR COMERCIALIZADORA</td>
                            </tr>
                            <tr>
                              <td style={{ height: '24px', border: '1px solid #000', padding: '4px 6px', fontWeight: 'bold', fontSize: '12px' }}>MUNICIPIO/ESTADO</td>
                              <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', fontSize: '12px' }}>VERACRUZ, BOCA DEL RIO</td>
                              <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>FECHA</td>
                            </tr>
                            <tr>
                              <td style={{ height: '24px', border: '1px solid #000', padding: '4px 6px', fontWeight: 'bold', fontSize: '12px' }}>SUCURSAL</td>
                              <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', fontSize: '12px' }}>{currentBranch.name?.toUpperCase() || 'SUCURSAL'}</td>
                              <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', fontSize: '12px' }}>{new Date().toLocaleDateString('es-MX', {day: '2-digit', month: '2-digit', year: '2-digit'})}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    
                    {/* CUERPO - 2x2 Grid Original */}
                    <tr>
                      <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '10px', paddingBottom: '20px' }}>
                        {renderTableSection('Bases Originales', groupedProducts['Bases Originales'], true)}
                      </td>
                      <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '10px', paddingBottom: '20px' }}>
                        {renderTableSection('Coberturas', groupedProducts['Coberturas'], false)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '10px', paddingBottom: '20px' }}>
                        {renderTableSection('Bases Flat', groupedProducts['Bases Flat'], true)}
                      </td>
                      <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '10px', paddingBottom: '20px' }}>
                        {renderTableSection('Rellenos', groupedProducts['Rellenos'], false)}
                      </td>
                    </tr>

                    {/* SECCIÓN OTROS Y KITS */}
                    {((otros.length > 0 || !viewOrder) || (kits.length > 0 || !viewOrder)) && (
                      <tr>
                        <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '10px', paddingBottom: '20px' }}>
                          { (otros.length > 0 || !viewOrder) && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000' }} className="po-table">
                              <thead>
                                <tr>
                                  <th colSpan={viewOrder ? 3 : 4} style={{ background: '#3b82f6', color: 'white', padding: '8px', border: '1px solid #000', fontSize: '14px' }}>
                                    OTROS
                                  </th>
                                </tr>
                                <tr style={{ background: '#f8fafc' }}>
                                  <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>CATEGORÍA</th>
                                  <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>PRODUCTO</th>
                                  <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px', width: '80px' }}>CANTIDAD</th>
                                  {!viewOrder && <th style={{ border: '1px solid #000', width: '40px' }} data-html2canvas-ignore="true"></th>}
                                </tr>
                              </thead>
                              <tbody>
                                {otros.map((item, idx) => (
                                  <tr key={`otro-${idx}`}>
                                    <td style={{ border: '1px solid #000', padding: '4px' }}>
                                      <input 
                                        type="text" 
                                        value={item.category} 
                                        onChange={(e) => handleUpdateOtro(idx, 'category', e.target.value)}
                                        disabled={!!viewOrder}
                                        style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '12px' }}
                                        placeholder="Ej. ACCESORIOS"
                                      />
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '4px' }}>
                                      <input 
                                        type="text" 
                                        value={item.product} 
                                        onChange={(e) => handleUpdateOtro(idx, 'product', e.target.value)}
                                        disabled={!!viewOrder}
                                        style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '12px' }}
                                        placeholder="Ej. FUNDA QUIOSCO"
                                      />
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                                      <input 
                                        type="number" 
                                        value={item.quantity} 
                                        onChange={(e) => handleUpdateOtro(idx, 'quantity', e.target.value)}
                                        disabled={!!viewOrder}
                                        style={{ width: '100%', border: 'none', textAlign: 'center', background: 'transparent', outline: 'none', fontSize: '12px' }}
                                        placeholder="0"
                                      />
                                    </td>
                                    {!viewOrder && (
                                      <td style={{ border: '1px solid #000', textAlign: 'center' }} data-html2canvas-ignore="true">
                                        <button onClick={() => handleRemoveOtro(idx)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                                {!viewOrder && (
                                  <tr data-html2canvas-ignore="true">
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '8px', border: '1px solid #000' }}>
                                      <button onClick={handleAddOtro} className="glass-btn" style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto' }}>
                                        <Plus size={14}/> Añadir Otro
                                      </button>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          )}
                        </td>
                        <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '10px', paddingBottom: '20px' }}>
                          { (kits.length > 0 || !viewOrder) && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000' }} className="po-table">
                              <thead>
                                <tr>
                                  <th colSpan={viewOrder ? 2 : 3} style={{ background: '#3b82f6', color: 'white', padding: '8px', border: '1px solid #000', fontSize: '14px' }}>
                                    KITS
                                  </th>
                                </tr>
                                <tr style={{ background: '#f8fafc' }}>
                                  <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>PRODUCTO</th>
                                  <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px', width: '80px' }}>CANTIDAD</th>
                                  {!viewOrder && <th style={{ border: '1px solid #000', width: '40px' }} data-html2canvas-ignore="true"></th>}
                                </tr>
                              </thead>
                              <tbody>
                                {kits.map((item, idx) => (
                                  <tr key={`kit-${idx}`}>
                                    <td style={{ border: '1px solid #000', padding: '4px' }}>
                                      <input 
                                        type="text" 
                                        value={item.product} 
                                        onChange={(e) => handleUpdateKit(idx, 'product', e.target.value)}
                                        disabled={!!viewOrder}
                                        style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '12px' }}
                                        placeholder="Ej. KIT DE 1 BISNAGA"
                                      />
                                    </td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                                      <input 
                                        type="number" 
                                        value={item.quantity} 
                                        onChange={(e) => handleUpdateKit(idx, 'quantity', e.target.value)}
                                        disabled={!!viewOrder}
                                        style={{ width: '100%', border: 'none', textAlign: 'center', background: 'transparent', outline: 'none', fontSize: '12px' }}
                                        placeholder="0"
                                      />
                                    </td>
                                    {!viewOrder && (
                                      <td style={{ border: '1px solid #000', textAlign: 'center' }} data-html2canvas-ignore="true">
                                        <button onClick={() => handleRemoveKit(idx)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                                {!viewOrder && (
                                  <tr data-html2canvas-ignore="true">
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '8px', border: '1px solid #000' }}>
                                      <button onClick={handleAddKit} className="glass-btn" style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto' }}>
                                        <Plus size={14}/> Añadir Kit
                                      </button>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}

                    {/* OBSERVACIONES */}
                    { (observaciones || !viewOrder) && (
                      <tr>
                        <td colSpan="2" style={{ padding: '0 0 20px 0' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000' }}>
                            <tbody>
                              <tr>
                                <td style={{ padding: '8px', background: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid #000' }}>OBSERVACIONES:</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px' }}>
                                  <textarea 
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    disabled={!!viewOrder}
                                    style={{ width: '100%', minHeight: '60px', border: 'none', resize: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '12px', background: 'transparent' }}
                                    placeholder="Escribe notas adicionales aquí..."
                                  />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              </div>

            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
