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
  UserCheck
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
      
    } catch (err) {
      setCheckoutError(err.message);
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Use the AuthContext to conditionally show the Asistencia admin tab
  const { isAdmin } = React.useContext(AuthContext);

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

  if (isAdmin) {
    tabs.push({ id: 'asistencia-admin', path: '/asistencia-admin', label: 'Asistencia', icon: UserCheck });
  }

  const W = isCollapsed ? 72 : 260;
  return (
    <>
      {/* Sidebar fijo en pantalla */}
      <aside 
        className="glass-panel"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${W}px`,
          height: '100vh',
          background: 'rgba(255, 255, 255, 0.58)',
          backdropFilter: 'saturate(200%) blur(28px)',
          WebkitBackdropFilter: 'saturate(200%) blur(28px)',
          borderRight: '1.5px solid rgba(255, 255, 255, 0.85)',
          boxShadow: '8px 0 36px rgba(15, 39, 71, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem 0.75rem',
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 200,
          borderRadius: 0
        }}
      >

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.7)' }}>
          <img
            src="/logo.png"
            alt="Kekala"
            style={{
              height: isCollapsed ? '36px' : '110px',
              maxWidth: '100%',
              objectFit: 'contain',
              transition: 'height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              filter: 'drop-shadow(0 4px 12px rgba(26, 79, 153, 0.15))'
            }}
          />
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
          <div style={{ flex: 1 }} />
          
          {!isAdmin && (
            <button
              onClick={() => setIsCheckoutModalOpen(true)}
              className="nav-item"
              style={{
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '10px' : '10px 14px',
                borderRadius: 'var(--radius-sm)',
                gap: isCollapsed ? 0 : '12px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                marginTop: 'auto'
              }}
              title={isCollapsed ? 'Registrar Salida' : ''}
            >
              <UserCheck size={20} style={{ flexShrink: 0 }} />
              {!isCollapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>Registrar Salida</span>}
            </button>
          )}

          <button
            onClick={() => supabase.auth.signOut()}
            className="nav-item"
            style={{
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: isCollapsed ? '10px' : '10px 14px',
              borderRadius: 'var(--radius-sm)',
              gap: isCollapsed ? 0 : '12px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              marginTop: '8px'
            }}
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
        className="glass-btn"
        style={{
          position: 'fixed',
          top: '24px',
          left: `${W - 14}px`,
          zIndex: 300,
          width: '28px',
          height: '28px',
          padding: 0,
          borderRadius: '50%',
          color: '#1a4f99',
          transition: 'left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,1)'
        }}
        title={isCollapsed ? 'Expandir' : 'Contraer'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Spacer para que el main-content no quede debajo del sidebar */}
      <div style={{ width: `${W}px`, flexShrink: 0, transition: 'width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />

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
