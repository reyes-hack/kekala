import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { Lock, User, ChevronRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LoginNIP() {
  const { branches } = useBranchStore();
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // Load branches (if not loaded) and employees for selected branch
  useEffect(() => {
    if (selectedBranchId) {
      loadEmployees(selectedBranchId);
    } else {
      setEmployees([]);
    }
  }, [selectedBranchId]);

  const loadEmployees = async (branchId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('branch_id', branchId)
        .order('full_name');
      
      if (!error && data) {
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedProfileId || pin.length !== 6) {
      setErrorMsg('Selecciona tu usuario e ingresa tu NIP de 6 dígitos.');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.rpc('verify_employee_pin', {
        p_profile_id: selectedProfileId,
        p_pin: pin
      });

      if (error) {
        throw error;
      }

      if (data === true) {
        // En un flujo real, aquí obtendríamos una sesión o JWT válido de Supabase Auth
        // Como es simulado/custom auth por ahora, marcamos el éxito
        alert('Acceso autorizado. (Integración de JWT pendiente por Backend)');
        navigate('/inventario'); 
      } else {
        setErrorMsg('NIP Incorrecto. Intenta de nuevo.');
        setPin('');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-liquid-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '40px', position: 'relative', overflow: 'hidden' }}>
        
        {/* Decorative ambient elements */}
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: 'var(--accent-gradient)', filter: 'blur(60px)', opacity: 0.3, zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '200px', height: '200px', background: '#10b981', filter: 'blur(80px)', opacity: 0.2, zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Logo Kekala" style={{ height: '110px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(26, 79, 153, 0.15))' }} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Sistema Kekala</h1>
          <p style={{ margin: '4px 0 8px 0', color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem' }}>Yunmar</p>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Acceso Operativo en Sucursal</p>
        </div>

        <form onSubmit={handleLogin} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Sucursal Select */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>1. Selecciona la Sucursal</label>
            <select 
              className="neo-input" 
              value={selectedBranchId} 
              onChange={e => { setSelectedBranchId(e.target.value); setSelectedProfileId(''); }}
              style={{ width: '100%', WebkitAppearance: 'none' }}
            >
              <option value="">-- Elija Sucursal --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Empleado Select */}
          {selectedBranchId && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>2. ¿Quién eres?</label>
              <select 
                className="neo-input" 
                value={selectedProfileId} 
                onChange={e => setSelectedProfileId(e.target.value)}
                style={{ width: '100%', WebkitAppearance: 'none' }}
              >
                <option value="">-- Selecciona tu Nombre --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role})</option>
                ))}
              </select>
            </div>
          )}

          {/* NIP Input */}
          {selectedProfileId && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>3. Ingresa tu NIP (6 dígitos)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'none' }} />
                <input 
                  type="password" 
                  className="neo-input"
                  style={{ width: '100%', paddingLeft: '48px', letterSpacing: '0.5em', fontSize: '1.2rem', textAlign: 'center' }}
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', fontSize: '0.9rem', textAlign: 'center', fontWeight: 600, border: '1px solid rgba(239,68,68,0.2)' }}>
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            className="neo-btn" 
            disabled={!selectedProfileId || pin.length !== 6 || loading}
            style={{ 
              marginTop: '8px', 
              background: (!selectedProfileId || pin.length !== 6 || loading) ? 'var(--bg-color)' : 'var(--accent-gradient)',
              color: (!selectedProfileId || pin.length !== 6 || loading) ? 'var(--text-muted)' : 'white',
              boxShadow: (!selectedProfileId || pin.length !== 6 || loading) ? 'none' : 'var(--accent-glow)',
              padding: '16px',
              display: 'flex',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? 'Verificando...' : 'Entrar a Caja'}
            {!loading && <ChevronRight size={20} />}
          </button>
        </form>

      </div>
    </div>
  );
}
