import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { Calendar, UserCheck, AlertCircle, Clock, X } from 'lucide-react';
import { NeoSelect } from '../components/NeoSelect';

export function AsistenciaAdmin() {
  const { branches } = useBranchStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [branchFilter, setBranchFilter] = useState('');

  // Modal Foto
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [dateFilter, branchFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('attendance_logs')
        .select(`
          *,
          profiles(first_name, last_name, display_name),
          branches(name),
          shifts(name, start_time, end_time)
        `)
        .eq('log_date', dateFilter)
        .order('check_in_at', { ascending: false });

      if (branchFilter) {
        query = query.eq('branch_id', branchFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ON_TIME': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', label: 'A Tiempo' };
      case 'LATE': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', label: 'Tarde' };
      case 'ABSENT': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', label: 'Ausente' };
      default: return { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', label: 'Pendiente' };
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPhotoUrl = (path) => {
    if (!path) return null;
    const { data } = supabase.storage.from('attendance-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Panel de Asistencia</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Monitorea el registro de entrada y salida del personal.</p>
        </div>
      </div>

      <div className="neo-surface" style={{ padding: '24px', borderRadius: '16px' }}>
        
        {/* Filtros */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Fecha</label>
            <input 
              type="date" 
              className="neo-input" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Sucursal</label>
            <NeoSelect 
              value={branchFilter} 
              onChange={(e) => setBranchFilter(e.target.value)}
              options={[{ label: 'Todas las sucursales', value: '' }, ...branches.map(b => ({ label: b.name, value: b.id }))]}
              placeholder="Todas las sucursales"
            />
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando registros...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
            <Calendar size={32} color="var(--text-secondary)" style={{ marginBottom: '16px' }} />
            <p>No hay registros de asistencia para esta fecha.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Empleado</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Sucursal / Turno</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>Entrada</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>Salida</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>Estado</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>Foto</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const status = getStatusColor(log.status);
                  const photoUrl = getPhotoUrl(log.photo_url);

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '600' }}>{log.profiles?.first_name} {log.profiles?.last_name}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>{log.branches?.name}</div>
                        {log.shifts && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {log.shifts.name} ({log.shifts.start_time.substring(0,5)} - {log.shifts.end_time.substring(0,5)})
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontWeight: '500' }}>{formatTime(log.check_in_at)}</div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontWeight: '500' }}>{formatTime(log.check_out_at)}</div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          background: status.bg,
                          color: status.text
                        }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {photoUrl ? (
                          <div 
                            style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', margin: '0 auto', cursor: 'pointer', background: '#000' }}
                            onClick={() => setSelectedPhoto(photoUrl)}
                          >
                            <img src={photoUrl} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Visor de Foto */}
      {selectedPhoto && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedPhoto(null)}
        >
          <button 
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={32} />
          </button>
          <img 
            src={selectedPhoto} 
            alt="Asistencia" 
            style={{ maxWidth: '90%', maxHeight: '90vh', borderRadius: '16px', objectFit: 'contain' }} 
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
