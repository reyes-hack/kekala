import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  PackageSearch,
  ShoppingCart,
  Banknote,
  Trash2,
  ChevronDown,
  MapPin
} from 'lucide-react';
import { useBranchStore } from '../store/useBranchStore';

export function Sidebar() {
  const { branches, activeBranch, fetchBranches, setActiveBranch } = useBranchStore();

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const tabs = [
    { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sucursales', path: '/sucursales', label: 'Sucursales', icon: Store },
    { id: 'inventario', path: '/inventario', label: 'Inventario', icon: PackageSearch },
    { id: 'ventas', path: '/ventas', label: 'Ventas (POS)', icon: ShoppingCart },
    { id: 'recetario', path: '/recetario', label: 'Recetario (BOM)', icon: ShoppingCart },
    { id: 'auditoria', path: '/auditoria', label: 'Auditoría', icon: PackageSearch },
    { id: 'gastos', path: '/gastos', label: 'Compras y Gastos', icon: Banknote },
    { id: 'mermas', path: '/mermas', label: 'Mermas', icon: Trash2 },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Kekala Custom Paleta" />
      </div>

      <div className="branch-selector" style={{ marginBottom: '1.5rem', padding: '0 8px' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
          Sucursal Activa
        </p>
        <div style={{ position: 'relative' }}>
          <select 
            value={activeBranch?.id || ''} 
            onChange={(e) => {
              const b = branches.find(br => br.id === e.target.value);
              if (b) setActiveBranch(b);
            }}
            style={{
              width: '100%',
              padding: '10px 32px 10px 36px',
              appearance: 'none',
              background: 'var(--surface-color)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--neo-shadow-inset)',
              color: 'var(--color-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {branches.length === 0 && <option value="">Cargando...</option>}
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
      </div>

      <nav className="sidebar-nav">
        {tabs.map(tab => (
          <NavLink
            key={tab.id}
            to={tab.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <tab.icon size={20} />
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
