import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export const NeoDatePicker = ({ name, value, onChange, required, placeholder = "Seleccionar Fecha" }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  
  // Parse initial date or use today
  const initialDate = value ? new Date(value + 'T12:00:00') : new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const selectDate = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = String(newDate.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    onChange({ target: { name, value: formatted } });
    setOpen(false);
  };

  const renderDays = () => {
    const days = [];
    const weekdays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
    
    // Weekdays header
    weekdays.forEach(day => {
      days.push(<div key={`w-${day}`} style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', paddingBottom: '8px' }}>{day}</div>);
    });

    // Empty slots
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`e-${i}`} />);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = value && new Date(value + 'T12:00:00').getDate() === i && new Date(value + 'T12:00:00').getMonth() === currentMonth.getMonth() && new Date(value + 'T12:00:00').getFullYear() === currentMonth.getFullYear();
      const isToday = new Date().getDate() === i && new Date().getMonth() === currentMonth.getMonth() && new Date().getFullYear() === currentMonth.getFullYear();
      
      days.push(
        <div 
          key={i} 
          onClick={() => selectDate(i)}
          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.05)' }}
          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto',
            cursor: 'pointer', fontSize: '0.9rem', fontWeight: isSelected ? 800 : (isToday ? 600 : 400),
            color: isSelected ? 'white' : (isToday ? 'var(--color-secondary)' : 'var(--text-primary)'),
            background: isSelected ? 'var(--accent-gradient)' : 'transparent',
            boxShadow: isSelected ? 'var(--accent-glow)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          {i}
        </div>
      );
    }
    return days;
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const displayValue = value ? new Date(value + 'T12:00:00').toLocaleDateString('es-MX', {day: '2-digit', month: '2-digit', year: 'numeric'}) : '';

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', zIndex: open ? 9999 : 1 }}>
      <div 
        className="glass-panel" 
        style={{ padding: '4px 16px', borderRadius: '14px', display: 'flex', alignItems: 'center', cursor: 'pointer', height: '44px', background: 'rgba(255, 255, 255, 0.48)' }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ flex: 1, color: value ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {displayValue || placeholder}
        </div>
        <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
      </div>

      {/* Inputs ocultos para compatibilidad con validación HTML5 required */}
      <input type="text" style={{display:'none'}} required={required} value={value} onChange={()=>{}} />
      
      {open && (
         <div 
           className="glass-panel" 
           style={{ 
             position: 'absolute', 
             top: '100%', 
             left: 0, 
             zIndex: 9999, 
             marginTop: '8px', 
             padding: '18px', 
             borderRadius: '24px', 
             width: '290px', 
             background: 'rgba(255, 255, 255, 0.88)',
             backdropFilter: 'saturate(200%) blur(32px)',
             WebkitBackdropFilter: 'saturate(200%) blur(32px)',
             border: '1.5px solid rgba(255, 255, 255, 0.95)',
             boxShadow: '0 20px 50px rgba(15, 39, 71, 0.18), inset 0 1px 0 rgba(255, 255, 255, 1)',
             animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
           }}
         >
            
            {/* Calendar Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div 
                onClick={handlePrevMonth}
                className="glass-btn"
                style={{ width: '32px', height: '32px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <ChevronLeft size={18} style={{color: 'var(--text-secondary)'}}/>
              </div>
              
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem', textTransform: 'capitalize' }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </div>

              <div 
                onClick={handleNextMonth}
                className="glass-btn"
                style={{ width: '32px', height: '32px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <ChevronRight size={18} style={{color: 'var(--text-secondary)'}}/>
              </div>
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px 0' }}>
              {renderDays()}
            </div>
         </div>
      )}
    </div>
  );
};
