import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export function MisHorarios() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHorarios = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        const { data, error } = await supabase
          .from('shift_assignments')
          .select(`
            day_of_week,
            shifts (
              name,
              start_time,
              end_time,
              branches ( name )
            )
          `)
          .eq('profile_id', session.user.id)
          .eq('is_active', true);
          
        if (error) throw error;
        
        setAssignments(data || []);
      } catch (error) {
        console.error("Error loading horarios:", error);
      } finally {
        setLoading(false);
      }
    };
    loadHorarios();
  }, [navigate]);

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const scheduleByDay = {};
  daysOfWeek.forEach((day, idx) => {
    scheduleByDay[idx] = assignments.filter(a => a.day_of_week === idx && a.shifts);
  });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '20px' }}>
      
      <button 
        onClick={() => navigate('/')}
        className="neo-btn"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '8px 16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}
      >
        <ArrowLeft size={20} /> Volver al Inicio
      </button>

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Mis Horarios Semanales
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
          Consulta tus turnos asignados por la administración
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando horarios...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {daysOfWeek.map((dayName, idx) => {
            const dayAssignments = scheduleByDay[idx];
            const hasShift = dayAssignments && dayAssignments.length > 0;
            
            return (
              <div key={idx} className="glass-panel" style={{ 
                padding: '24px', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderLeft: hasShift ? '4px solid var(--primary-color)' : '4px solid transparent',
                opacity: hasShift ? 1 : 0.6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '48px', height: '48px', 
                    borderRadius: '12px', 
                    background: hasShift ? 'rgba(30, 58, 138, 0.1)' : 'rgba(0,0,0,0.05)', 
                    color: hasShift ? 'var(--primary-color)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Calendar size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dayName}</div>
                    {hasShift ? (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} /> 
                        {dayAssignments.map((a, i) => {
                          const shiftData = Array.isArray(a.shifts) ? a.shifts[0] : a.shifts;
                          if (!shiftData) return null;
                          const branchName = shiftData.branches ? (Array.isArray(shiftData.branches) ? shiftData.branches[0]?.name : shiftData.branches.name) : 'Sucursal';
                          const startTime = shiftData.start_time ? shiftData.start_time.substring(0,5) : '--:--';
                          const endTime = shiftData.end_time ? shiftData.end_time.substring(0,5) : '--:--';
                          
                          return (
                            <span key={i} style={{ background: 'rgba(30, 58, 138, 0.05)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(30, 58, 138, 0.1)' }}>
                              <strong style={{color: 'var(--primary-color)'}}>{shiftData.name}</strong> ({startTime} - {endTime}) en {branchName}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Descanso / Sin turno asignado</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
