import React, { useState } from 'react';
import { RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react';

export function Sales() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string, results: any[] }
  const [syncDate, setSyncDate] = useState(new Date().toISOString().split('T')[0]); // Fecha de hoy por defecto

  const handleSync = async () => {
    try {
      setLoading(true);
      setStatus(null);
      const res = await fetch('http://localhost:3001/api/ventas/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: syncDate })
      });
      const data = await res.json();
      
      if (data.success) {
        setStatus({ type: 'success', message: data.message, results: data.results });
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

      <div className="neo-surface" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>Sincronizador Automático de Kárdex</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '600px', textAlign: 'center', lineHeight: '1.6' }}>
          Selecciona el día que deseas sincronizar. El sistema extraerá las ventas de Foodbot de esa fecha específica y 
          deducirá los totales del Kárdex de cada sucursal de forma automática usando el <strong>Recetario (BOM)</strong>.
        </p>

        <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Fecha a sincronizar:</label>
          <input 
            type="date" 
            value={syncDate}
            onChange={(e) => setSyncDate(e.target.value)}
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
          {loading ? 'Extrayendo y Sincronizando...' : 'Sincronizar Ventas Foodbot'}
        </button>

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
    </div>
  );
}
