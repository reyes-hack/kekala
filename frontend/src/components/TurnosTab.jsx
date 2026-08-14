import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { Clock, Plus, Trash2, Edit2, Calendar } from 'lucide-react';
import { NeoSelect } from './NeoSelect';

export function TurnosTab() {
  const { branches } = useBranchStore();
  const [shifts, setShifts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  
  const [shiftForm, setShiftForm] = useState({ id: null, branch_id: '', name: '', start_time: '10:00', end_time: '18:00' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Cargar turnos
      const { data: shiftsData } = await supabase
        .from('shifts')
        .select('*, branches(name)')
        .eq('is_active', true)
        .order('start_time');
      setShifts(shiftsData || []);

      // 2. Cargar asignaciones
      const { data: assignmentsData } = await supabase
        .from('shift_assignments')
        .select('*, profiles(first_name, last_name, display_name)')
        .eq('is_active', true);
      setAssignments(assignmentsData || []);

      // 3. Cargar empleados para los dropdowns
      const { data: empData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, display_name, branch_id')
        .eq('is_active', true);
      
      const formattedEmp = (empData || []).map(e => ({
        id: e.id,
        name: e.display_name || `${e.first_name} ${e.last_name}`,
        branch_id: e.branch_id
      }));
      setEmployees(formattedEmp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShift = async (e) => {
    e.preventDefault();
    if (!shiftForm.branch_id || !shiftForm.name || !shiftForm.start_time || !shiftForm.end_time) {
      alert("Por favor completa todos los campos del turno.");
      return;
    }
    
    setSaving(true);
    try {
      // Necesitamos el organization_id de la sucursal seleccionada
      const selectedBranch = branches.find(b => b.id === shiftForm.branch_id);
      const orgId = selectedBranch?.organization_id;
      if (!orgId) throw new Error("No organization_id found for selected branch");

      const payload = {
        organization_id: orgId,
        branch_id: shiftForm.branch_id,
        name: shiftForm.name,
        start_time: shiftForm.start_time,
        end_time: shiftForm.end_time,
      };

      if (shiftForm.id) {
        // Update
        const { error } = await supabase.from('shifts').update(payload).eq('id', shiftForm.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('shifts').insert(payload);
        if (error) throw error;
      }

      setIsShiftModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Error al guardar turno: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShift = async (id) => {
    if (!window.confirm("¿Seguro que deseas desactivar este turno? Se perderán las asignaciones actuales.")) return;
    try {
      await supabase.from('shifts').update({ is_active: false }).eq('id', id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignEmployee = async (shiftId, dayOfWeek, profileId) => {
    try {
      const shift = shifts.find(s => s.id === shiftId);
      const selectedBranch = branches.find(b => b.id === shift?.branch_id);
      const orgId = selectedBranch?.organization_id;
      if (!orgId) throw new Error("No organization_id found for selected branch");
      
      if (!profileId) {
        // Eliminar asignación actual si la hay
        await supabase
          .from('shift_assignments')
          .delete()
          .eq('shift_id', shiftId)
          .eq('day_of_week', dayOfWeek);
      } else {
        // Upsert asignación (el UQ constraint nos protege)
        // Wait, Upsert with composite key in Supabase JS requires matching the unique constraint
        // Let's just delete the existing one for this shift and day and insert new one
        await supabase
          .from('shift_assignments')
          .delete()
          .eq('shift_id', shiftId)
          .eq('day_of_week', dayOfWeek);

        const { error } = await supabase
          .from('shift_assignments')
          .insert({
            organization_id: orgId,
            shift_id: shiftId,
            profile_id: profileId,
            day_of_week: dayOfWeek
          });
        
        if (error) throw error;
      }
      loadData();
    } catch (err) {
      console.error(err);
      alert("Error al asignar: " + err.message);
    }
  };

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  if (loading && shifts.length === 0) return <div style={{ padding: '24px' }}>Cargando turnos...</div>;

  return (
    <div className="neo-surface" style={{ padding: '24px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Gestión de Turnos Semanales</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.875rem' }}>Configura los horarios y asigna a tu personal para la toma de asistencia.</p>
        </div>
        <button 
          className="neo-btn primary" 
          onClick={() => { setShiftForm({ id: null, branch_id: '', name: '', start_time: '10:00', end_time: '18:00' }); setIsShiftModalOpen(true); }}
        >
          <Plus size={18} /> Nuevo Turno
        </button>
      </div>

      {shifts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
          <Clock size={32} color="var(--text-secondary)" style={{ marginBottom: '16px' }} />
          <p>No hay turnos configurados aún.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', minWidth: '180px' }}>Sucursal / Horario</th>
                {daysOfWeek.map((day, i) => (
                  <th key={i} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', minWidth: '140px' }}>{day}</th>
                ))}
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}></th>
              </tr>
            </thead>
            <tbody>
              {shifts.map(shift => (
                <tr key={shift.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '500' }}>{shift.branches?.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <Clock size={12} /> {shift.name} ({shift.start_time.substring(0,5)} - {shift.end_time.substring(0,5)})
                    </div>
                  </td>
                  
                  {/* Celdas de asignación por día (0 = Lunes, ..., 6 = Domingo) */}
                  {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                    const assignment = assignments.find(a => a.shift_id === shift.id && a.day_of_week === dayIndex);
                    
                    return (
                      <td key={dayIndex} style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)' }}>
                        <select 
                          className="neo-input"
                          style={{ 
                            width: '100%', 
                            padding: '6px', 
                            fontSize: '0.75rem', 
                            height: '32px',
                            background: assignment ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                            color: assignment ? 'var(--brand-blue)' : 'var(--text-primary)',
                            borderColor: assignment ? 'rgba(56, 189, 248, 0.3)' : 'var(--border-color)',
                            fontWeight: assignment ? '600' : 'normal'
                          }}
                          value={assignment?.profile_id || ''}
                          onChange={(e) => handleAssignEmployee(shift.id, dayIndex, e.target.value)}
                        >
                          <option value="">-- Sin asignar --</option>
                          {employees.filter(e => e.branch_id === shift.branch_id).map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                  
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        className="neo-btn" 
                        style={{ padding: '6px', minWidth: 'auto', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}
                        onClick={() => { setShiftForm(shift); setIsShiftModalOpen(true); }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="neo-btn" 
                        style={{ padding: '6px', minWidth: 'auto', background: 'transparent', border: 'none', color: '#ef4444' }}
                        onClick={() => handleDeleteShift(shift.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Turno */}
      {isShiftModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="neo-surface" style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>{shiftForm.id ? 'Editar Turno' : 'Nuevo Turno'}</h3>
            
            <form onSubmit={handleSaveShift} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px' }}>Sucursal</label>
                <NeoSelect 
                  value={shiftForm.branch_id} 
                  onChange={(e) => setShiftForm({...shiftForm, branch_id: e.target.value})}
                  options={branches.map(b => ({ label: b.name, value: b.id }))}
                  placeholder="Selecciona sucursal"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px' }}>Nombre del Turno (ej. Matutino)</label>
                <input 
                  type="text" 
                  className="neo-input" 
                  value={shiftForm.name} 
                  onChange={e => setShiftForm({...shiftForm, name: e.target.value})}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px' }}>Hora Entrada</label>
                  <input 
                    type="time" 
                    className="neo-input" 
                    value={shiftForm.start_time} 
                    onChange={e => setShiftForm({...shiftForm, start_time: e.target.value})}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px' }}>Hora Salida</label>
                  <input 
                    type="time" 
                    className="neo-input" 
                    value={shiftForm.end_time} 
                    onChange={e => setShiftForm({...shiftForm, end_time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="neo-btn" onClick={() => setIsShiftModalOpen(false)}>Cancelar</button>
                <button type="submit" className="neo-btn primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
