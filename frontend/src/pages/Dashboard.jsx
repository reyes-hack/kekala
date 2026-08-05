import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { TrendingUp, TrendingDown, DollarSign, PackageSearch, AlertTriangle, Activity } from 'lucide-react';

export function Dashboard() {
  const { activeBranch } = useBranchStore();
  const [loading, setLoading] = useState(true);
  
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalExpenses: 0,
    lowStockItems: 0,
    totalMermas: 0
  });

  useEffect(() => {
    if (activeBranch) {
      loadDashboardData();
    }
  }, [activeBranch]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Very basic prototype data fetching for the dashboard.
      // In a real app, this would be an RPC call or complex aggregations.
      
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      // 1. Total Sales (assuming footbot_syncs table holds this or we sum POS sales)
      // Since POS sales table might not have real data, we'll fetch from `sales` if it exists.
      let totalSales = 0;
      const { data: salesData } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('branch_id', activeBranch.id)
        .gte('created_at', startOfMonth);
      
      if (salesData) {
        totalSales = salesData.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
      }

      // 2. Total Expenses
      let totalExpenses = 0;
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('branch_id', activeBranch.id)
        .gte('date', startOfMonth);
      
      if (expensesData) {
        totalExpenses = expensesData.reduce((acc, curr) => acc + Number(curr.amount), 0);
      }

      // 3. Low Stock Items
      const { count: lowStockItems } = await supabase
        .from('branch_inventory')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', activeBranch.id)
        .lt('current_stock', 5); // Simplification: assume < 5 is low

      // 4. Mermas (Waste Records)
      let totalMermas = 0;
      const { data: wasteData } = await supabase
        .from('waste_items')
        .select('quantity')
        .eq('organization_id', activeBranch.organization_id); // we'd filter by branch too if waste_items had it, or we join

      if (wasteData) {
        totalMermas = wasteData.reduce((acc, curr) => acc + Number(curr.quantity), 0);
      }

      setMetrics({
        totalSales,
        totalExpenses,
        lowStockItems: lowStockItems || 0,
        totalMermas
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!activeBranch) return <div style={{textAlign: 'center', padding: '40px'}}>Selecciona una sucursal</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '0 20px', maxWidth: '1400px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
         <div style={{ background: 'var(--accent-gradient)', padding: '12px', borderRadius: '16px', color: 'white', boxShadow: 'var(--neo-shadow-sm)' }}>
           <Activity size={32} />
         </div>
         <div>
           <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 800 }}>Tablero Principal</h1>
           <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Resumen operativo de {activeBranch.name}</p>
         </div>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '40px'}}>Cargando métricas...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          
          <div className="neo-surface" style={{ padding: '24px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '16px', color: '#10b981' }}>
              <TrendingUp size={32} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Ventas del Mes</p>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 800 }}>${metrics.totalSales.toLocaleString('es-MX', {minimumFractionDigits: 2})}</h3>
            </div>
          </div>

          <div className="neo-surface" style={{ padding: '24px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '16px', color: '#ef4444' }}>
              <TrendingDown size={32} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Gastos del Mes</p>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 800 }}>${metrics.totalExpenses.toLocaleString('es-MX', {minimumFractionDigits: 2})}</h3>
            </div>
          </div>

          <div className="neo-surface" style={{ padding: '24px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '16px', color: '#f59e0b' }}>
              <AlertTriangle size={32} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Mermas (Piezas)</p>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 800 }}>{metrics.totalMermas} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>uds</span></h3>
            </div>
          </div>

          <div className="neo-surface" style={{ padding: '24px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '16px', color: '#3b82f6' }}>
              <PackageSearch size={32} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Stock Crítico</p>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 800 }}>{metrics.lowStockItems} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>prods</span></h3>
            </div>
          </div>

        </div>
      )}

      {/* Chart Placeholder for future implementation */}
      <div className="neo-surface" style={{ padding: '40px', borderRadius: '20px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <DollarSign size={48} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Cortes de Caja y Gráficos estarán disponibles próximamente</p>
      </div>

    </div>
  );
}
