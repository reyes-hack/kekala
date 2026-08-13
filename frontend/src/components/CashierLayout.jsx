import React, { useContext, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from './ProtectedRoute';
import { LogOut, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';

export function CashierLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useContext(AuthContext);
  const { fetchBranches, branches } = useBranchStore();

  useEffect(() => {
    if (branches.length === 0) {
      fetchBranches();
    }
  }, [fetchBranches, branches.length]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isDashboard = location.pathname === '/';

  return (
    <div className="app-container dashboard-liquid-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header */}
      <header className="glass-panel" style={{ 
        position: 'sticky', top: 0, zIndex: 100, borderRadius: 0, 
        padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.5)'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {!isDashboard && (
            <button 
              onClick={() => navigate('/')}
              className="glass-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', fontWeight: 600 }}
            >
              <ArrowLeft size={18} />
              <span className="hide-on-mobile">Volver al Menú</span>
            </button>
          )}
          <img src="/logo.png" alt="Kekala" style={{ height: '36px', objectFit: 'contain' }} />
          <div style={{ paddingLeft: '12px', borderLeft: '1.5px solid rgba(0,0,0,0.1)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', lineHeight: 1.1 }}>Modo Operativo</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{session?.user?.user_metadata?.name || 'Empleado'}</span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="glass-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', color: 'var(--danger)' }}
        >
          <LogOut size={18} />
          <span className="hide-on-mobile" style={{ fontWeight: 600 }}>Cerrar Sesión</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>

    </div>
  );
}
