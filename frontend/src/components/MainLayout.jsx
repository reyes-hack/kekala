import React, { useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationsBell } from './NotificationsBell';
import { Settings } from 'lucide-react';
import { AuthContext } from './ProtectedRoute';
import { CashierLayout } from './CashierLayout';

function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="app-container dashboard-liquid-bg" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, padding: '80px 2.5rem 2rem 2.5rem', position: 'relative', overflowX: 'hidden' }}>
        <div style={{ position: 'fixed', top: '16px', right: '24px', zIndex: 150, display: 'flex', gap: '12px', alignItems: 'center' }}>
          <NotificationsBell />
          <button 
            onClick={() => navigate('/configuracion')}
            className="glass-btn"
            style={{ 
              borderRadius: '50%', 
              width: '48px', 
              height: '48px', 
              padding: 0,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
            title="Configuración"
          >
            <Settings size={22} />
          </button>
        </div>
        <div className="glass-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function MainLayout() {
  const { isAdmin } = useContext(AuthContext);
  return isAdmin ? <AdminLayout /> : <CashierLayout />;
}
