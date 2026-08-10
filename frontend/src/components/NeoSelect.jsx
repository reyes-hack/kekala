import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const NeoSelect = ({ name, value, onChange, options, placeholder, required }) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // options can be an array of strings OR an array of objects {label, value}
  const isObjectOptions = options.length > 0 && typeof options[0] === 'object';
  
  // Buscar el label correspondiente al valor actual
  const currentOption = isObjectOptions ? options.find(o => o.value === value) : value;
  const displayValue = open ? filter : (currentOption ? (isObjectOptions ? currentOption.label : currentOption) : (value || ''));
  
  const filtered = options.filter(o => {
    const label = isObjectOptions ? o.label : o;
    return label.toLowerCase().includes((filter || '').toLowerCase());
  });

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', zIndex: open ? 9999 : 1 }}>
      <div 
        className="glass-panel" 
        style={{ padding: '4px 16px', borderRadius: '14px', display: 'flex', alignItems: 'center', cursor: 'text', background: 'rgba(255, 255, 255, 0.48)' }}
        onClick={() => setOpen(true)}
      >
        <input 
          type="text"
          value={displayValue}
          onChange={(e) => {
            const val = e.target.value.toUpperCase();
            setFilter(val);
            onChange({ target: { name, value: val }});
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          required={required}
          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem', height: '36px' }}
        />
        <ChevronDown size={18} style={{ color: 'var(--text-muted)', cursor: 'pointer', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} onClick={(e) => { e.stopPropagation(); setOpen(!open); }} />
      </div>
      
      {open && (
         <div 
           className="glass-panel" 
           style={{ 
             position: 'absolute', 
             top: '100%', 
             left: 0, 
             right: 0, 
             zIndex: 9999, 
             maxHeight: '220px', 
             overflowY: 'auto', 
             marginTop: '8px', 
             padding: '8px', 
             borderRadius: '16px',
             background: 'rgba(255, 255, 255, 0.88)',
             backdropFilter: 'saturate(200%) blur(32px)',
             WebkitBackdropFilter: 'saturate(200%) blur(32px)',
             border: '1.5px solid rgba(255, 255, 255, 0.95)',
             boxShadow: '0 16px 40px rgba(15, 39, 71, 0.15), inset 0 1px 0 rgba(255, 255, 255, 1)'
           }}
         >
            {filtered.map(opt => {
               const lbl = isObjectOptions ? opt.label : opt;
               const val = isObjectOptions ? opt.value : opt;
               const isSelected = value === val || value === lbl;
               return (
                 <div 
                   key={val}
                   style={{ 
                     padding: '10px 16px', 
                     cursor: 'pointer', 
                     borderRadius: '10px', 
                     fontWeight: isSelected ? 700 : 500, 
                     color: isSelected ? 'var(--text-on-brand)' : 'var(--text-primary)', 
                     background: isSelected ? 'var(--accent-gradient)' : 'transparent', 
                     boxShadow: isSelected ? 'var(--accent-glow)' : 'none',
                     marginBottom: '4px',
                     transition: 'all 0.15s ease'
                   }}
                   onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.background = 'rgba(26, 79, 153, 0.08)' }}
                   onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.background = 'transparent' }}
                   onClick={() => {
                      onChange({ target: { name, value: val, label: lbl }});
                      setFilter('');
                      setOpen(false);
                   }}
                 >
                   {lbl}
                 </div>
               )
            })}
            
            {!isObjectOptions && filter && !filtered.find(o => (isObjectOptions ? o.label : o) === filter) && (
               <div 
                 style={{ padding: '10px 16px', cursor: 'pointer', color: 'var(--status-ok)', fontWeight: 700, borderTop: filtered.length > 0 ? '1px solid rgba(255,255,255,0.6)' : 'none', marginTop: filtered.length > 0 ? '4px' : '0' }}
                 onClick={() => {
                    onChange({ target: { name, value: filter }});
                    setFilter('');
                    setOpen(false);
                 }}
               >
                 + Usar "{filter}"
               </div>
            )}
            
            {filtered.length === 0 && (!filter || isObjectOptions) && (
               <div style={{ padding: '10px 16px', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Sin resultados...</div>
            )}
         </div>
      )}
    </div>
  );
};
