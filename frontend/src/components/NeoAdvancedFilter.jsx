import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { NeoSelect } from './NeoSelect';
import { NeoDatePicker } from './NeoDatePicker';

/**
 * Universal Advanced Filter Component
 * @param {string} globalSearch - The current search query
 * @param {function} onSearchChange - Callback for search input
 * @param {object} filters - Active advanced filters { key: value }
 * @param {function} onFilterApply - (key, value) => void
 * @param {function} onClearFilters - () => void
 * @param {Array} filterConfig - Configuration array for advanced filters
 *        Example: [
 *          { id: 'status', label: 'Estado', type: 'select', options: [{val: 'ACTIVE', label: 'Activos'}, {val: 'INACTIVE', label: 'Inactivos'}] },
 *          { id: 'date_from', label: 'Desde', type: 'date' },
 *          { id: 'date_to', label: 'Hasta', type: 'date' }
 *        ]
 */
export function NeoAdvancedFilter({ 
  globalSearch, 
  onSearchChange, 
  filters, 
  onFilterApply, 
  onClearFilters,
  filterConfig = []
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeFiltersCount = Object.keys(filters).filter(k => filters[k]).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', position: 'relative', zIndex: drawerOpen ? 50 : 1 }}>
      
      {/* Top Bar: Search + Filter Button */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
        
        {/* Main Search Input */}
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={20} />
          </div>
          <input 
            type="text"
            className="neo-input"
            placeholder="Buscar en todos los registros (Nombre, Folio, etc.)..."
            value={globalSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', fontSize: '1rem', background: 'var(--surface-color)', border: 'none', boxShadow: 'var(--neo-shadow-inset)' }}
          />
          {globalSearch && (
            <button 
              onClick={() => onSearchChange('')}
              style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Filter Trigger Button */}
        {filterConfig.length > 0 && (
          <button 
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={`neo-btn ${drawerOpen || activeFiltersCount > 0 ? 'neo-btn-primary' : ''}`}
            style={{ 
              padding: '16px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 600,
              background: drawerOpen || activeFiltersCount > 0 ? 'var(--primary-color)' : 'var(--surface-color)',
              color: drawerOpen || activeFiltersCount > 0 ? 'white' : 'var(--text-primary)'
            }}
          >
            <Filter size={20} />
            Filtros
            {activeFiltersCount > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Advanced Filters Panel (Drawer/Accordion) */}
      {drawerOpen && filterConfig.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease-out', position: 'relative', zIndex: 60 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={20} style={{ color: '#1a4f99' }} /> Opciones Avanzadas
            </h3>
            {activeFiltersCount > 0 && (
              <button onClick={onClearFilters} style={{ background: 'transparent', border: 'none', color: 'var(--status-danger)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                Limpiar Todo
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
            {filterConfig.map(conf => (
              <div key={conf.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>{conf.label}</label>
                
                {conf.type === 'select' && (
                  <NeoSelect
                    name={conf.id}
                    value={filters[conf.id] || ''}
                    onChange={(e) => onFilterApply(conf.id, e.target.value)}
                    options={[{value: '', label: 'Todas las opciones'}, ...conf.options.map(opt => ({value: opt.val, label: opt.label}))]}
                    placeholder="Todas las opciones"
                  />
                )}

                {conf.type === 'date' && (
                  <NeoDatePicker
                    name={conf.id}
                    value={filters[conf.id] || ''}
                    onChange={(e) => onFilterApply(conf.id, e.target.value)}
                    placeholder="Seleccionar fecha"
                  />
                )}

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
