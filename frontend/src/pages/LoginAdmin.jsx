import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lock, Mail, ChevronRight, Activity, Shield } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  
  // Revisamos si venimos rebotados por el ProtectedRoute (Intento de intrusión)
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    if (location.state?.unauthorized) {
      setErrorMsg('⛔ ACCESO DENEGADO: Tu usuario no tiene un perfil administrativo o rol asignado en este sistema. El intento ha sido registrado.');
      // Limpiamos el estado para que no se quede atascado si el usuario recarga
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Credenciales inválidas. Verifica tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-liquid-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '40px', position: 'relative', overflow: 'hidden' }}>

        {/* Decorative ambient elements */}
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: 'var(--accent-gradient)', filter: 'blur(60px)', opacity: 0.3, zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '200px', height: '200px', background: '#3b82f6', filter: 'blur(80px)', opacity: 0.2, zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Logo Kekala" style={{ height: '180px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(26, 79, 153, 0.15))' }} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Sistema Kekala</h1>
          <p style={{ margin: '4px 0 8px 0', color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem' }}>Yunmar</p>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Acceso Administrativo Seguro</p>
        </div>

        <form onSubmit={handleLogin} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'none' }} />
              <input
                type="email"
                className="neo-input"
                style={{ width: '100%', paddingLeft: '48px' }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@kekala.app"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'none' }} />
              <input
                type="password"
                className="neo-input"
                style={{ width: '100%', paddingLeft: '48px' }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {errorMsg && (
            <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', fontSize: '0.9rem', textAlign: 'center', fontWeight: 600, border: '1px solid rgba(239,68,68,0.2)' }}>
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="neo-btn neo-btn-primary"
            disabled={!email || !password || loading}
            style={{
              marginTop: '8px',
              padding: '16px',
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '1rem'
            }}
          >
            {loading ? 'Autenticando...' : 'Iniciar Sesión'}
            {!loading && <ChevronRight size={20} />}
          </button>
        </form>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: '24px' }}>
          <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
            Soy empleado de sucursal (Acceso por NIP)
          </button>
        </div>

      </div>
    </div>
  );
}
