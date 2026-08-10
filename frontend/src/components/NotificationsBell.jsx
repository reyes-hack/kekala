import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';

export function NotificationsBell() {
  const { activeBranch } = useBranchStore();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // We would fetch real notifications from Supabase here
    // For now, let's load dummy notifications if Angel hasn't built the table
    const loadNotifs = async () => {
      try {
        let query = supabase.from('notifications').select('*');
        if (activeBranch) {
           query = query.or(`branch_id.eq.${activeBranch.id},branch_id.is.null`);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
        
        if (error && error.code !== 'PGRST205') throw error;
        
        if (error?.code === 'PGRST205') {
           setNotifications([]);
           setUnreadCount(0);
        } else {
           setNotifications(data || []);
           setUnreadCount((data || []).filter(n => !n.is_read).length);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    loadNotifs();
  }, [activeBranch]);

  const markAsRead = async (id) => {
    try {
      // Update local state first for instant UI response
      const updated = notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
      setNotifications(updated);
      setUnreadCount(updated.filter(n => !n.is_read).length);
      
      // Update in DB
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'ALERT': return <AlertTriangle size={18} color="#ef4444" />;
      case 'WARNING': return <AlertCircle size={18} color="#f59e0b" />;
      case 'SUCCESS': return <CheckCircle2 size={18} color="#10b981" />;
      default: return <Info size={18} color="#3b82f6" />;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
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
          color: 'var(--text-primary)',
          position: 'relative'
        }}
        title="Notificaciones"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', 
            top: '6px', 
            right: '8px', 
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
            color: 'white', 
            fontSize: '0.65rem', 
            fontWeight: 'bold', 
            borderRadius: '50%', 
            width: '18px', 
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="glass-panel"
          style={{ 
            position: 'absolute', 
            top: '60px', 
            right: '0', 
            width: '350px', 
            background: 'rgba(255, 255, 255, 0.85)', 
            backdropFilter: 'saturate(200%) blur(32px)',
            WebkitBackdropFilter: 'saturate(200%) blur(32px)',
            borderRadius: '20px', 
            boxShadow: '0 20px 50px rgba(15, 39, 71, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)', 
            zIndex: 100,
            border: '1.5px solid rgba(255, 255, 255, 0.9)',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.4)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Notificaciones</h3>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{unreadCount} nuevas</span>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 500 }}>
                No tienes notificaciones.
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => markAsRead(n.id)}
                  style={{ 
                    padding: '14px 18px', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.4)', 
                    background: n.is_read ? 'transparent' : 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '12px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(255, 255, 255, 0.4)'}
                >
                  <div style={{ marginTop: '2px' }}>
                    {getIcon(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{n.message}</p>
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                      {new Date(n.created_at).toLocaleString('es-MX')}
                    </span>
                  </div>
                  {!n.is_read && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1a4f99', alignSelf: 'center', marginLeft: 'auto', boxShadow: '0 0 10px rgba(26, 79, 153, 0.8)' }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
