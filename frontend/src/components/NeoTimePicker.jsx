import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

export const NeoTimePicker = ({ value, onChange, placeholder = "Seleccionar Hora", required }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  
  // value expected as "HH:mm" (24h format)
  const [hour, setHour] = useState(value ? value.split(':')[0] : '10');
  const [minute, setMinute] = useState(value ? value.split(':')[1] : '00');
  
  useEffect(() => {
    if (value) {
      setHour(value.split(':')[0]);
      setMinute(value.split(':')[1]);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHourSelect = (h) => {
    const newHour = String(h).padStart(2, '0');
    setHour(newHour);
    onChange({ target: { value: `${newHour}:${minute}` } });
  };

  const handleMinuteSelect = (m) => {
    const newMinute = String(m).padStart(2, '0');
    setMinute(newMinute);
    onChange({ target: { value: `${hour}:${newMinute}` } });
    setOpen(false); // Auto close when minute is selected
  };

  // Formato 12 horas para mostrar
  const displayHour = parseInt(hour) % 12 || 12;
  const ampm = parseInt(hour) >= 12 ? 'p.m.' : 'a.m.';
  const displayValue = `${String(displayHour).padStart(2, '0')}:${minute} ${ampm}`;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', zIndex: open ? 9999 : 1 }}>
      <div 
        className="glass-panel" 
        style={{ 
          padding: '4px 16px', 
          borderRadius: '14px', 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer', 
          background: 'rgba(255, 255, 255, 0.48)' 
        }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ flex: 1, padding: '6px 0', color: value ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>
          {value ? displayValue : placeholder}
        </div>
        <Clock size={16} color="var(--text-muted)" style={{ transition: 'transform 0.3s' }} />
      </div>

      {open && (
        <div 
          className="glass-panel fade-in" 
          style={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            marginTop: '8px', 
            width: '280px',
            padding: '16px', 
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            zIndex: 100
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>
              HORA (24H)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
              {Array.from({ length: 24 }).map((_, i) => {
                const h = String(i).padStart(2, '0');
                const isSelected = hour === h;
                return (
                  <div
                    key={h}
                    onClick={(e) => { e.stopPropagation(); handleHourSelect(i); }}
                    style={{
                      padding: '8px 0',
                      textAlign: 'center',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 700 : 500,
                      background: isSelected ? 'var(--brand-blue)' : 'transparent',
                      color: isSelected ? 'white' : 'var(--text-primary)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.05)' }}
                    onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    {h}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '12px 0' }} />

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>
              MINUTOS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => {
                const minStr = String(m).padStart(2, '0');
                const isSelected = minute === minStr;
                return (
                  <div
                    key={minStr}
                    onClick={(e) => { e.stopPropagation(); handleMinuteSelect(m); }}
                    style={{
                      padding: '8px 0',
                      textAlign: 'center',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 700 : 500,
                      background: isSelected ? 'var(--brand-blue)' : 'transparent',
                      color: isSelected ? 'white' : 'var(--text-primary)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.05)' }}
                    onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    {minStr}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
