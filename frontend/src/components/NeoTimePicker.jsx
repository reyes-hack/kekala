import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

export const NeoTimePicker = ({ value, onChange, placeholder = "Seleccionar Hora", required }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  
  // value expected as "HH:mm" (24h format)
  const [hour, setHour] = useState(value ? value.split(':')[0] : '10');
  const [minute, setMinute] = useState(value ? value.split(':')[1] : '00');
  
  const hourRef = useRef(null);
  const minuteRef = useRef(null);

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

  // Auto-scroll to selected items when opened
  useEffect(() => {
    if (open) {
      const hEl = document.getElementById(`hour-${hour}`);
      if (hEl && hourRef.current) {
        hourRef.current.scrollTop = hEl.offsetTop - hourRef.current.offsetHeight / 2 + hEl.offsetHeight / 2;
      }
      const mEl = document.getElementById(`minute-${minute}`);
      if (mEl && minuteRef.current) {
        minuteRef.current.scrollTop = mEl.offsetTop - minuteRef.current.offsetHeight / 2 + mEl.offsetHeight / 2;
      }
    }
  }, [open, hour, minute]);

  const handleHourSelect = (h) => {
    const newHour = String(h).padStart(2, '0');
    setHour(newHour);
    onChange({ target: { value: `${newHour}:${minute}` } });
  };

  const handleMinuteSelect = (m) => {
    const newMinute = String(m).padStart(2, '0');
    setMinute(newMinute);
    onChange({ target: { value: `${hour}:${newMinute}` } });
  };

  // Formato 12 horas para mostrar
  const displayHour = parseInt(hour) % 12 || 12;
  const ampm = parseInt(hour) >= 12 ? 'p.m.' : 'a.m.';
  const displayValue = `${String(displayHour).padStart(2, '0')}:${minute} ${ampm}`;

  const hoursList = Array.from({ length: 24 }).map((_, i) => String(i).padStart(2, '0'));
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => String(m).padStart(2, '0'));

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
            width: '240px',
            padding: '12px', 
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            zIndex: 100
          }}
        >
          <div style={{ display: 'flex', gap: '12px', height: '220px' }}>
            {/* Columna Horas */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--glass-border-subtle)' }}>
                HORA
              </div>
              <div ref={hourRef} style={{ flex: 1, overflowY: 'auto', paddingTop: '4px', scrollBehavior: 'smooth' }} className="hide-scrollbar">
                {hoursList.map(h => {
                  const isSelected = hour === h;
                  return (
                    <div
                      id={`hour-${h}`}
                      key={h}
                      onClick={(e) => { e.stopPropagation(); handleHourSelect(h); }}
                      style={{
                        padding: '10px 0',
                        textAlign: 'center',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: isSelected ? '1.1rem' : '0.9rem',
                        fontWeight: isSelected ? 700 : 500,
                        background: isSelected ? 'var(--accent-gradient)' : 'transparent',
                        color: isSelected ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                        boxShadow: isSelected ? 'var(--accent-glow)' : 'none',
                        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        marginBottom: '2px'
                      }}
                      onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.03)' }}
                      onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background = 'transparent' }}
                    >
                      {h}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Separador */}
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>:</div>

            {/* Columna Minutos */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--glass-border-subtle)' }}>
                MINUTO
              </div>
              <div ref={minuteRef} style={{ flex: 1, overflowY: 'auto', paddingTop: '4px', scrollBehavior: 'smooth' }} className="hide-scrollbar">
                {minutesList.map(m => {
                  const isSelected = minute === m;
                  return (
                    <div
                      id={`minute-${m}`}
                      key={m}
                      onClick={(e) => { e.stopPropagation(); handleMinuteSelect(m); }}
                      style={{
                        padding: '10px 0',
                        textAlign: 'center',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: isSelected ? '1.1rem' : '0.9rem',
                        fontWeight: isSelected ? 700 : 500,
                        background: isSelected ? 'var(--accent-gradient)' : 'transparent',
                        color: isSelected ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                        boxShadow: isSelected ? 'var(--accent-glow)' : 'none',
                        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        marginBottom: '2px'
                      }}
                      onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.03)' }}
                      onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background = 'transparent' }}
                    >
                      {m}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
