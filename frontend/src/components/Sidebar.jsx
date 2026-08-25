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
  MapPin,
  LogOut,
  UserCheck,
  Menu,
  X as XIcon
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { NeoSelect } from './NeoSelect';

import { AuthContext } from './ProtectedRoute';

export function Sidebar() {
  const { branches, activeBranch, fetchBranches, setActiveBranch } = useBranchStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Checkout State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutPin, setCheckoutPin] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (checkoutPin.length !== 6) {
      setCheckoutError('NIP debe tener 6 dígitos.');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa.');

      const profileId = session.user.id;

      // 1. Verify PIN
      const { error: authError } = await supabase.functions.invoke('iniciar_sesion_cajero', {
        body: { profile_id: profileId, pin: checkoutPin }
      });

      if (authError) throw new Error('NIP Incorrecto.');

      // 2. Register Checkout
      const today = new Date().toISOString().split('T')[0];
      const { data: existingLog } = await supabase
        .from('attendance_logs')
        .select('id')
        .eq('profile_id', profileId)
        .eq('log_date', today)
        .single();

      if (existingLog) {
        await supabase.from('attendance_logs').update({ check_out_at: new Date().toISOString() }).eq('id', existingLog.id);
      }

      // 3. Log out
      await supabase.auth.signOut();
      setActiveBranch(null);
      
    } catch (err) {
      setCheckoutError(err.message);
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Use the AuthContext to conditionally show the Asistencia admin tab
  const { isAdmin, isCashier } = React.useContext(AuthContext);

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

  if (isCashier && !isAdmin) {
    tabs.push({ id: 'asistencia', path: '/asistencia', label: 'Mi Asistencia', icon: UserCheck });
  } else if (isAdmin) {
    tabs.push({ id: 'asistencia-admin', path: '/asistencia-admin', label: 'Asistencia', icon: UserCheck });
    tabs.push({ id: 'finanzas', path: '/finanzas', label: 'Config. Finanzas', icon: Banknote });
    tabs.push({ id: 'configuracion', path: '/configuracion', label: 'Sucursales', icon: LayoutDashboard });
  }

  const W = isCollapsed ? 72 : 260;
  return (
    <>
      {/* Sidebar */}
      <aside 
        className={`sidebar glass-panel ${isCollapsed ? 'is-collapsed' : ''}`}
        style={{
          '--sidebar-w': `${W}px`,
        }}
      >

        {/* Logo */}
        <div className="sidebar-logo">
          <img
            src="/logo.png"
            alt="Kekala"
            className="sidebar-logo-img"
          />
          <button className="mobile-toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <Menu size={24} /> : <XIcon size={24} />}
          </button>
        </div>

        {/* Branch selector */}
        {!isCollapsed ? (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
              Sucursal Activa
            </p>
            {isAdmin ? (
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
            ) : (
              <div style={{ 
                padding: '10px 14px', 
                borderRadius: '12px', 
                background: 'rgba(26, 79, 153, 0.06)', 
                border: '1px solid rgba(26, 79, 153, 0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>
                <MapPin size={16} style={{ color: '#1a4f99' }} />
                {activeBranch?.name || 'Sin sucursal'}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div title={activeBranch?.name} className="glass-icon-circle" style={{ width: '40px', height: '40px', borderRadius: '12px', color: '#1a4f99' }}>
              <MapPin size={18} />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="sidebar-nav">
          {tabs.map(tab => (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`}
              title={isCollapsed ? tab.label : ''}
              onClick={() => {
                if (window.innerWidth <= 768) setIsCollapsed(true);
              }}
            >
              <tab.icon size={20} style={{ flexShrink: 0 }} />
              {!isCollapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{tab.label}</span>}
            </NavLink>
          ))}
          <div style={{ flex: 1 }} />
          
          {!isAdmin && (
            <button
              onClick={() => setIsCheckoutModalOpen(true)}
              className={`nav-item bottom-action ${isCollapsed ? 'collapsed' : ''}`}
              title={isCollapsed ? 'Registrar Salida' : ''}
            >
              <UserCheck size={20} style={{ flexShrink: 0 }} />
              {!isCollapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>Registrar Salida</span>}
            </button>
          )}

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              setActiveBranch(null);
            }}
            className={`nav-item bottom-action logout-btn ${isCollapsed ? 'collapsed' : ''}`}
            title={isCollapsed ? 'Cerrar Sesión' : ''}
          >
            <LogOut size={20} style={{ flexShrink: 0 }} />
            {!isCollapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>Cerrar Sesión</span>}
          </button>
        </nav>
      </aside>

      {/* Botón de colapso flotante estilo cristal */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="glass-btn sidebar-toggle-btn"
        style={{
          '--sidebar-w': `${W}px`,
        }}
        title={isCollapsed ? 'Expandir' : 'Contraer'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Spacer para que el main-content no quede debajo del sidebar */}
      <div className="sidebar-spacer" style={{ width: `${W}px`, flexShrink: 0, transition: 'width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />

      {/* Modal de Checkout */}
      {isCheckoutModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="neo-surface fade-in" style={{ width: '100%', maxWidth: '360px', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0' }}>Registrar Salida</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.875rem' }}>
              Ingresa tu NIP para registrar tu salida de hoy.
            </p>
            <form onSubmit={handleCheckout}>
              <input
                type="password"
                placeholder="Tu NIP de 6 dígitos"
                className="neo-input"
                maxLength={6}
                value={checkoutPin}
                onChange={(e) => setCheckoutPin(e.target.value.replace(/\D/g, ''))}
                style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.25rem', padding: '16px', marginBottom: '16px' }}
                required
              />
              {checkoutError && (
                <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '16px' }}>{checkoutError}</div>
              )}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="neo-btn" style={{ flex: 1 }} onClick={() => { setIsCheckoutModalOpen(false); setCheckoutPin(''); setCheckoutError(''); }}>
                  Cancelar
                </button>
                <button type="submit" className="neo-btn primary" style={{ flex: 1 }} disabled={checkoutLoading}>
                  {checkoutLoading ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
