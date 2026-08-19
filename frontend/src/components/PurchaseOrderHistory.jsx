import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FileText, Clock, CheckCircle, XCircle, PackageCheck, Download } from 'lucide-react';
import { exportToExcelWithStyles } from '../utils/exportUtils';
import { PurchaseOrderModal } from './PurchaseOrderModal';

import { useNeoFilters } from '../hooks/useNeoFilters';
import { NeoAdvancedFilter } from './NeoAdvancedFilter';
import { NeoPagination } from './NeoPagination';
import { NeoSelect } from './NeoSelect';
import { AuthContext } from './ProtectedRoute';

export function PurchaseOrderHistory() {
  const { isAdmin, session } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState({});
  const [viewingOrder, setViewingOrder] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);

  const {
    page, pageSize, globalSearch, advancedFilters,
    setPage, setPageSize, setGlobalSearch, applyAdvancedFilter, clearFilters
  } = useNeoFilters({ initialPageSize: 10 });

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize, globalSearch, advancedFilters]);

  const fetchBranches = async () => {
    const { data } = await supabase.from('branches').select('id, name, organization_id');
    if (data) {
      const bMap = {};
      data.forEach(b => bMap[b.id] = { name: b.name, orgId: b.organization_id });
      setBranches(bMap);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('purchase_orders')
        .select('*', { count: 'exact' });

      if (!isAdmin) {
        // Empleados solo ven su sucursal y máximo 3
        const branchId = session?.user?.app_metadata?.branch_id;
        if (branchId) {
          query = query.eq('branch_id', branchId);
        }
        query = query.limit(3);
      } else {
        // Advanced Filters
        if (advancedFilters.status) {
          query = query.eq('status', advancedFilters.status);
        }
        if (advancedFilters.date_from) {
          query = query.gte('created_at', advancedFilters.date_from + 'T00:00:00');
        }
        if (advancedFilters.date_to) {
          query = query.lte('created_at', advancedFilters.date_to + 'T23:59:59');
        }
        if (advancedFilters.branch) {
          query = query.eq('branch_id', advancedFilters.branch);
        }

        // Global Search
        if (globalSearch) {
          query = query.or(`justification.ilike.%${globalSearch}%,id.ilike.%${globalSearch}%`);
        }

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setTotalRecords(count || 0);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    if (order.status === 'ENTREGADA') {
      alert("Esta orden ya fue entregada y sumada al inventario. No se puede modificar.");
      return;
    }

    if (newStatus === order.status) return;

    let justification = null;

    if (newStatus === 'RECHAZADA') {
      justification = window.prompt("Por favor, ingresa el motivo del rechazo:");
      if (justification === null) return; // Canceló el prompt
    }

    if (newStatus === 'ENTREGADA') {
      const confirm = window.confirm(
        "🚨 ¡CUIDADO! 🚨\n\nAl marcar como ENTREGADA, el sistema sumará automáticamente todas las cantidades de esta orden al inventario de la sucursal.\n\nEsta acción es IRREVERSIBLE.\n\n¿La mercancía ya está físicamente en la sucursal?"
      );
      if (!confirm) return;

      // Procesar suma de inventario
      try {
        await processInventoryAddition(order);
      } catch (err) {
        console.error("Error sumando inventario:", err);
        alert("Hubo un error al intentar sumar el inventario. Se abortó la operación.");
        return;
      }
    }

    // Actualizar estado
    try {
      const updateData = { status: newStatus };
      if (justification) updateData.justification = justification;

      const { error } = await supabase
        .from('purchase_orders')
        .update(updateData)
        .eq('id', order.id);

      if (error) throw error;
      
      if (newStatus === 'ENTREGADA') {
        alert("✅ ¡Inventario actualizado con éxito! La mercancía ya está en la sucursal.");
      }
      
      fetchOrders();
    } catch (err) {
      console.error("Error actualizando estado:", err);
      alert("Hubo un error al actualizar el estado de la orden.");
    }
  };

  const processInventoryAddition = async (order) => {
    const { orderState, basesOrig, basesFlat, coberturas, rellenos } = order.order_data;
    const inventoryUpdates = [];

    // Bases (multiplicar cajas x piezas)
    [...(basesOrig || []), ...(basesFlat || [])].forEach(item => {
      const qtyCajas = orderState[item.product.id] || 0;
      if (qtyCajas > 0) {
        inventoryUpdates.push({
          product_id: item.product.id,
          add_amount: qtyCajas * (item.product.items_per_box || 1)
        });
      }
    });

    // Líquidos (cantidad directa en Litros, convertir a mL para BD)
    [...(coberturas || []), ...(rellenos || [])].forEach(item => {
      const qtyLitros = orderState[item.product.id] || 0;
      if (qtyLitros > 0) {
        inventoryUpdates.push({
          product_id: item.product.id,
          add_amount: qtyLitros * 1000 // Multiplicar por 1000 para insertar mL
        });
      }
    });

    const orgId = branches[order.branch_id]?.orgId;
    const movementTypeId = '7d9cc151-6aba-4545-ac53-17362d02293e'; // Mismo tipo (AJUSTE/ENTRADA)

    // Actualizar base de datos
    for (const update of inventoryUpdates) {
      // El trigger en inventory_movements actualizará automáticamente el branch_inventory.
      // Por lo tanto, NO actualizamos branch_inventory manualmente aquí para evitar que se duplique el stock.
      if (orgId) {
        await supabase.from('inventory_movements').insert({
          organization_id: orgId,
          branch_id: order.branch_id,
          product_id: update.product_id,
          movement_type_id: movementTypeId,
          quantity: update.add_amount,
          notes: `Entrega de Orden de Compra #${order.id.slice(0, 8)}`
        });
      }
    }
  };

  const handleDownloadExcel = (order) => {
    const branchName = branches[order.branch_id]?.name || 'Sucursal';
    const excelData = {
      branchName: branchName,
      date: new Date(order.created_at).toLocaleDateString('es-MX', {day: '2-digit', month: '2-digit', year: '2-digit'}),
      basesOrig: order.order_data.basesOrig || [],
      basesFlat: order.order_data.basesFlat || [],
      coberturas: order.order_data.coberturas || [],
      rellenos: order.order_data.rellenos || [],
      orderState: order.order_data.orderState || {}
    };
    exportToExcelWithStyles(excelData, `Orden_Compra_${branchName}_Historial.xlsx`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ENVIADA': return '#3b82f6'; // Azul
      case 'ACEPTADA': return '#f59e0b'; // Naranja
      case 'RECHAZADA': return '#ef4444'; // Rojo
      case 'ENTREGADA': return '#10b981'; // Verde
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ENVIADA': return <Clock size={16} />;
      case 'ACEPTADA': return <CheckCircle size={16} />;
      case 'RECHAZADA': return <XCircle size={16} />;
      case 'ENTREGADA': return <PackageCheck size={16} />;
      default: return null;
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando historial de órdenes...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {isAdmin && (
        <div style={{ marginBottom: '10px' }}>
          <NeoAdvancedFilter 
            globalSearch={globalSearch}
            onSearchChange={setGlobalSearch}
            filters={advancedFilters}
            onFilterApply={applyAdvancedFilter}
            onClearFilters={clearFilters}
            filterConfig={[
              { id: 'date_from', label: 'Desde Fecha', type: 'date' },
              { id: 'date_to', label: 'Hasta Fecha', type: 'date' },
              { id: 'status', label: 'Estado', type: 'select', options: [
                {val: 'ENVIADA', label: 'ENVIADA'},
                {val: 'ACEPTADA', label: 'ACEPTADA'},
                {val: 'RECHAZADA', label: 'RECHAZADA'},
                {val: 'ENTREGADA', label: 'ENTREGADA'}
              ] },
              { id: 'branch', label: 'Sucursal', type: 'select', options: Object.entries(branches).map(([id, b]) => ({val: id, label: b.name})) }
            ]}
          />
        </div>
      )}
      {orders.length === 0 ? (
        <div className="neo-surface" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3>No hay órdenes de compra registradas</h3>
          <p>Las órdenes generadas aparecerán aquí.</p>
        </div>
      ) : (
        orders.map((order, index) => (
          <div key={order.id} className="neo-surface fade-in" style={{ padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `6px solid ${getStatusColor(order.status)}`, position: 'relative', zIndex: orders.length - index }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {new Date(order.created_at).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '1.2rem' }}>
                Sucursal: {branches[order.branch_id]?.name || 'Cargando...'}
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: `${getStatusColor(order.status)}20`,
                  color: getStatusColor(order.status),
                  padding: '6px 12px', borderRadius: '20px',
                  fontWeight: 'bold', fontSize: '0.85rem'
                }}>
                  {getStatusIcon(order.status)} {order.status}
                </span>
                
                {order.status === 'RECHAZADA' && order.justification && (
                  <span style={{ fontSize: '0.9rem', color: '#ef4444', fontStyle: 'italic' }}>
                    Motivo: {order.justification}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {isAdmin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cambiar Estado:</label>
                  <NeoSelect 
                    name="status"
                    value={order.status}
                    onChange={(e) => handleStatusChange(order, e.target.value)}
                    disabled={order.status === 'ENTREGADA'}
                    options={[
                      {value: "ENVIADA", label: "ENVIADA"},
                      {value: "ACEPTADA", label: "ACEPTADA (Proveedor Confirmó)"},
                      {value: "RECHAZADA", label: "RECHAZADA"},
                      {value: "ENTREGADA", label: "ENTREGADA A SUCURSAL (Suma Inventario)"}
                    ]}
                    placeholder="Seleccionar Estado"
                    style={{ minWidth: '150px' }}
                  />
                </div>
              )}

              <button 
                className="neo-btn"
                onClick={() => handleDownloadExcel(order)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', height: 'fit-content' }}
                title="Descargar Excel Original"
              >
                <Download size={18} /> Excel
              </button>
              
              <button 
                className="neo-btn"
                onClick={() => setViewingOrder(order)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', height: 'fit-content' }}
                title="Ver e Imprimir PDF"
              >
                <FileText size={18} /> Ver PDF
              </button>
            </div>
          </div>
        ))
      )}

      {isAdmin && totalRecords > 0 && !loading && (
        <NeoPagination 
          currentPage={page}
          pageSize={pageSize}
          totalCount={totalRecords}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {viewingOrder && (
        <PurchaseOrderModal 
          viewOrder={viewingOrder} 
          onClose={() => setViewingOrder(null)} 
        />
      )}
    </div>
  );
}
