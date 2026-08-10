import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Universal Pagination Component
 */
export function NeoPagination({ 
  currentPage, 
  pageSize, 
  totalCount, 
  onPageChange,
  onPageSizeChange 
}) {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startRecord = ((currentPage - 1) * pageSize) + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '16px 24px', borderRadius: '20px', marginTop: '20px' }}>
      
      {/* Metrics */}
      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Mostrando <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{totalCount === 0 ? 0 : startRecord}</span> a <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{endRecord}</span> de <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{totalCount}</span> resultados
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        
        {/* Page Size Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Filas por página:
          <select 
            className="neo-input"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.5)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', width: 'auto' }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Page Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="glass-btn"
            style={{ width: '36px', height: '36px', padding: 0, borderRadius: '10px', opacity: currentPage <= 1 ? 0.4 : 1, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: '90px', textAlign: 'center' }}>
            Página {currentPage} de {totalPages}
          </div>

          <button 
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="glass-btn"
            style={{ width: '36px', height: '36px', padding: 0, borderRadius: '10px', opacity: currentPage >= totalPages ? 0.4 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
