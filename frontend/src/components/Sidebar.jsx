import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  Banknote,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { useBranchStore } from '../store/useBranchStore';
import { NeoSelect } from './NeoSelect';

export function Sidebar() {
  const { branches, activeBranch, fetchBranches, setActiveBranch } = useBranchStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const tabs = [
    { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventario', path: '/inventario', label: 'Inventario', icon: PackageSearch },
    { id: 'ventas', path: '/ventas', label: 'Ventas (POS)', icon: ShoppingCart },
    { id: 'recetario', path: '/recetario', label: 'Recetario (BOM)', icon: ShoppingCart },
    { id: 'auditoria', path: '/auditoria', label: 'Auditoría', icon: PackageSearch },
    { id: 'cortes', path: '/cortes', label: 'Cortes de Caja', icon: Banknote },
    { id: 'gastos', path: '/gastos', label: 'Compras y Gastos', icon: Banknote },
    { id: 'mermas', path: '/mermas', label: 'Mermas', icon: Trash2 },
  ];

  const W = isCollapsed ? 72 : 260;

  return (
    <>
      {/* Sidebar fijo en pantalla */}
      <aside style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${W}px`,
        height: '100vh',
        background: 'var(--surface-color)',
        boxShadow: 'var(--neo-shadow-flat)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0.75rem',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 200
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(26,79,153,0.1)' }}>
          <img
            src="/logo.png"
            alt="Kekala"
            style={{
              height: isCollapsed ? '36px' : '110px',
              maxWidth: '100%',
              objectFit: 'contain',
              transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)'
            }}
          />
        </div>

        {/* Branch selector */}
        {!isCollapsed ? (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
              Sucursal Activa
            </p>
            <NeoSelect
              name="branch"
              value={activeBranch?.id || ''}
              onChange={(e) => {
                const b = branches.find(br => br.id === e.target.value);
                if (b) setActiveBranch(b);
              }}
              options={branches.map(b => ({ value: b.id, label: b.name }))}
              placeholder="Selecciona sucursal..."
            />
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div title={activeBranch?.name} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--surface-color)', boxShadow: 'var(--neo-shadow-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
              <MapPin size={18} />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {tabs.map(tab => (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={{
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '10px' : '10px 14px',
                borderRadius: 'var(--radius-sm)',
                gap: isCollapsed ? 0 : '12px',
              }}
              title={isCollapsed ? tab.label : ''}
            >
              <tab.icon size={20} style={{ flexShrink: 0 }} />
              {!isCollapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{tab.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Botón de colapso flotante */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'fixed',
          top: '24px',
          left: `${W - 14}px`,
          zIndex: 300,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: 'none',
          background: 'var(--surface-color)',
          boxShadow: 'var(--neo-shadow-flat)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--color-secondary)',
          transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)'
        }}
        title={isCollapsed ? 'Expandir' : 'Contraer'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Spacer para que el main-content no quede debajo del sidebar */}
      <div style={{ width: `${W}px`, flexShrink: 0, transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)' }} />
    </>
  );
}
