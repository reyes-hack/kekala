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
          position: 'relative'
        }}
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', 
            top: '8px', 
            right: '10px', 
            background: '#ef4444', 
            color: 'white', 
            fontSize: '0.65rem', 
            fontWeight: 'bold', 
            borderRadius: '50%', 
            width: '18px', 
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--surface-color)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{ 
          position: 'absolute', 
          top: '60px', 
          right: '0', 
          width: '350px', 
          background: 'var(--surface-color)', 
          borderRadius: '16px', 
          boxShadow: 'var(--neo-shadow-hover)', 
          zIndex: 100,
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Notificaciones</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{unreadCount} nuevas</span>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No tienes notificaciones.
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => markAsRead(n.id)}
                  style={{ 
                    padding: '16px', 
                    borderBottom: '1px solid var(--border-color)', 
                    background: 'var(--surface-color)',
                    boxShadow: n.is_read ? 'none' : 'var(--neo-shadow-inset)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '12px',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--neo-shadow-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = n.is_read ? 'none' : 'var(--neo-shadow-inset)'}
                >
                  <div style={{ marginTop: '2px' }}>
                    {getIcon(n.type)}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{n.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{n.message}</p>
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(n.created_at).toLocaleString('es-MX')}
                    </span>
                  </div>
                  {!n.is_read && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', alignSelf: 'center', marginLeft: 'auto', boxShadow: '0 0 8px var(--primary-color)' }} />
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
