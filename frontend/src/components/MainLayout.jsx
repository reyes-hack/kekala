import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationsBell } from './NotificationsBell';
import { Settings } from 'lucide-react';

export function MainLayout() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, padding: '80px 2.5rem 2rem 2.5rem', position: 'relative', overflowX: 'hidden' }}>
        <div style={{ position: 'fixed', top: '16px', right: '24px', zIndex: 150, display: 'flex', gap: '12px', alignItems: 'center' }}>
          <NotificationsBell />
          <button 
            onClick={() => navigate('/configuracion')}
            style={{ 
              background: 'var(--surface-color)', 
              border: 'none', 
              borderRadius: '50%', 
              width: '48px', 
              height: '48px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--neo-shadow-flat)',
              color: 'var(--text-primary)',
              transition: 'box-shadow 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--neo-shadow-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--neo-shadow-flat)'}
            onMouseDown={(e) => e.currentTarget.style.boxShadow = 'var(--neo-shadow-inset)'}
            onMouseUp={(e) => e.currentTarget.style.boxShadow = 'var(--neo-shadow-hover)'}
          >
            <Settings size={24} />
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
