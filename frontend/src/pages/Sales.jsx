import React, { useState, useEffect } from 'react';
import { RefreshCcw, CheckCircle2, AlertCircle, History, Settings, Power } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export function Sales() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string, results: any[] }
  const [syncDate, setSyncDate] = useState(new Date().toLocaleDateString('en-CA')); // Fecha de hoy YYYY-MM-DD local
  const [history, setHistory] = useState([]);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [branchesConfig, setBranchesConfig] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      // Fetch global toggle
      const { data: globalData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'FOODBOT_SYNC_GLOBAL_ENABLED')
        .single();
      if (globalData) setGlobalEnabled(globalData.value === 'true' || globalData.value === true);

      // Fetch branches config
      const { data: branchesData } = await supabase
        .from('branches')
        .select('id, name, opening_time, closing_time, foodbot_sync_enabled')
        .order('name');
      if (branchesData) setBranchesConfig(branchesData);

      // Fetch history
      const { data: historyData } = await supabase
        .from('sync_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (historyData) setHistory(historyData);
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const toggleGlobalSync = async () => {
    const newVal = !globalEnabled;
    setGlobalEnabled(newVal);
    await supabase.from('system_settings').upsert({
      key: 'FOODBOT_SYNC_GLOBAL_ENABLED',
      value: newVal
    });
  };

  const toggleBranchSync = async (id, currentVal) => {
    const newVal = !currentVal;
    setBranchesConfig(prev => prev.map(b => b.id === id ? { ...b, foodbot_sync_enabled: newVal } : b));
    await supabase.from('branches').update({ foodbot_sync_enabled: newVal }).eq('id', id);
  };

  const updateBranchHours = async (id, field, value) => {
    setBranchesConfig(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
    await supabase.from('branches').update({ [field]: value }).eq('id', id);
  };

  const handleSync = async () => {
    try {
      setLoading(true);
      setStatus(null);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/ventas/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: syncDate })
      });
      const data = await res.json();
      
      if (data.success) {
        setStatus({ type: 'success', message: data.message, results: data.results });
        fetchConfig(); // Refresh history
      } else {
        setStatus({ type: 'error', message: data.message });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Error de red: No se pudo contactar al backend en el puerto 3001.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in delay-1">
      <div className="page-header">
        <div>
          <h1>Sincronización de Ventas</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Procesa las ventas extraídas de Foodbot y descuenta el inventario automáticamente.
          </p>
        </div>
      </div>

      <div className="responsive-grid-2" style={{ marginTop: '24px' }}>
        
        {/* Panel Izquierdo: Configuración de Scraper */}
        <div className="neo-surface" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Automatización Foodbot</h2>
            <button 
              onClick={toggleGlobalSync}
              className={`glass-btn ${globalEnabled ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: globalEnabled ? 'var(--status-ok)' : 'var(--surface-color)', color: globalEnabled ? '#fff' : 'var(--text-primary)' }}
            >
              <Power size={18} />
              {globalEnabled ? 'Activado Globalmente' : 'Desactivado Globalmente'}
            </button>
          </div>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
            Cuando está activado, el servidor extraerá las ventas cada 4 horas a partir de la hora de apertura de cada sucursal. Al llegar la hora de cierre, la sincronización se detiene automáticamente.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {branchesConfig.map(branch => (
              <div key={branch.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--neo-shadow-inset)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600 }}>{branch.name}</span>
                    <button 
                      onClick={() => toggleBranchSync(branch.id, branch.foodbot_sync_enabled)}
                      style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                        background: branch.foodbot_sync_enabled ? 'var(--status-ok)' : 'var(--text-muted)', color: '#fff'
                      }}
                    >
                      {branch.foodbot_sync_enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', opacity: branch.foodbot_sync_enabled ? 1 : 0.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Apertura:</span>
                      <input 
                        type="time" 
                        value={branch.opening_time ? branch.opening_time.slice(0,5) : ''} 
                        onChange={(e) => updateBranchHours(branch.id, 'opening_time', e.target.value + ':00')}
                        disabled={!branch.foodbot_sync_enabled}
                        style={{ padding: '2px 4px', fontSize: '0.85rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cierre:</span>
                      <input 
                        type="time" 
                        value={branch.closing_time ? branch.closing_time.slice(0,5) : ''} 
                        onChange={(e) => updateBranchHours(branch.id, 'closing_time', e.target.value + ':00')}
                        disabled={!branch.foodbot_sync_enabled}
                        style={{ padding: '2px 4px', fontSize: '0.85rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Derecho: Modo Manual e Historial */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="neo-surface" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>Sincronización Manual</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
              Fuerza la sincronización en este preciso momento para las ventas acumuladas del día de hoy.
            </p>

            <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Fecha a sincronizar:</label>
              <input 
                type="date" 
                value={syncDate}
                onChange={(e) => setSyncDate(e.target.value)}
                max={new Date().toLocaleDateString('en-CA')}
                style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--bg-color)', boxShadow: 'var(--neo-shadow-inset)', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)', fontSize: '1rem', minWidth: '200px' }}
              />
            </div>
            
            <button 
              onClick={handleSync}
              disabled={loading || !syncDate}
              className="neo-btn neo-btn-primary"
              style={{ padding: '16px 32px', fontSize: '1.1rem', opacity: loading || !syncDate ? 0.7 : 1, cursor: loading || !syncDate ? 'not-allowed' : 'pointer' }}
            >
              <RefreshCcw size={24} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'Extrayendo...' : 'Sincronizar Hoy'}
            </button>
          </div>

          <div className="neo-surface" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <History size={20} color="var(--primary-color)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Historial Reciente</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>No hay sincronizaciones recientes.</p>
              ) : (
                history.map(h => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${h.status === 'SUCCESS' ? 'var(--status-ok)' : 'var(--status-danger)'}` }}>
                    {h.status === 'SUCCESS' ? <CheckCircle2 size={16} color="var(--status-ok)" style={{ marginTop: '2px' }} /> : <AlertCircle size={16} color="var(--status-danger)" style={{ marginTop: '2px' }} />}
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{new Date(h.created_at).toLocaleString()}</span>
                        <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--surface-color)', color: 'var(--text-secondary)' }}>Día: {h.sync_date}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{h.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

        {status && (
          <div className="neo-surface-inset" style={{ marginTop: '32px', padding: '24px', width: '100%', maxWidth: '600px', borderLeft: `4px solid ${status.type === 'success' ? 'var(--status-ok)' : 'var(--status-danger)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              {status.type === 'success' ? (
                <CheckCircle2 size={24} style={{ color: 'var(--status-ok)', marginRight: '8px' }} />
              ) : (
                <AlertCircle size={24} style={{ color: 'var(--status-danger)', marginRight: '8px' }} />
              )}
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: status.type === 'success' ? 'var(--status-ok)' : 'var(--status-danger)' }}>
                {status.type === 'success' ? 'Sincronización Exitosa' : 'Error en la Sincronización'}
              </h3>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{status.message}</p>
            
            {status.results && status.results.map((r, i) => (
              <div key={i} className="neo-surface" style={{ padding: '16px', marginBottom: '12px' }}>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{r.branchName || r.branch}</p>
                <ul style={{ listStyleType: 'none', paddingLeft: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <li style={{ marginBottom: '4px' }}>• Productos directos deducidos: <strong style={{ color: 'var(--text-primary)' }}>{r.directProductsCount || r.directItemsDeducted || 0}</strong></li>
                  <li>• Insumos de receta (líquidos) deducidos: <strong style={{ color: 'var(--text-primary)' }}>{r.recipeInputsCount || r.modifiersDeducted || 0}</strong></li>
                </ul>
                
                {/* Deducidos */}
                {r.deductedItems && r.deductedItems.length > 0 && (
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(52, 152, 219, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary-color)' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '4px' }}>
                      Productos descontados del inventario:
                    </p>
                    <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '20px', listStyleType: 'circle', maxHeight: '150px', overflowY: 'auto' }}>
                      {r.deductedItems.map((item, idx) => (
                        <li key={idx}><strong>{item.quantity}</strong> x {item.name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Faltantes */}
                {(r.missingRules || r.warnings) && (r.missingRules || r.warnings).length > 0 && (
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(243, 156, 18, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--status-warn)' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--status-warn)', marginBottom: '4px' }}>
                      <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Faltantes en el Recetario:
                    </p>
                    <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '20px', listStyleType: 'circle' }}>
                      {(r.missingRules || r.warnings).map((w, wIndex) => (
                        <li key={wIndex}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
