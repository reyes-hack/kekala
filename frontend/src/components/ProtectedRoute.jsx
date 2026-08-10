import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export function ProtectedRoute() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuthAndProfile = async (currentSession) => {
      if (!currentSession) {
        setSession(null);
        setHasProfile(false);
        setLoading(false);
        return;
      }

      // Check if user exists in the profiles table (use maybeSingle to avoid 406 errors)
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', currentSession.user.id)
        .maybeSingle();

      if (error || !data) {
        // User has an auth account but no profile in the system -> Unauthorized
        await supabase.auth.signOut().catch(() => {}); // Catch 403s on corrupted sessions
        setSession(null);
        setHasProfile(false);
      } else {
        setSession(currentSession);
        setHasProfile(true);
      }
      setLoading(false);
    };

    // Initial check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      checkAuthAndProfile(initialSession);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
        checkAuthAndProfile(newSession);
      } else if (_event === 'SIGNED_OUT') {
        setSession(null);
        setHasProfile(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Cargando sesión segura...</div>
      </div>
    );
  }

  // If no session or no profile, redirect to /login-admin
  // We pass 'unauthorized: true' in state so the login screen can show a red warning
  if (!session || !hasProfile) {
    return <Navigate to="/login-admin" state={{ from: location, unauthorized: !hasProfile && session }} replace />;
  }

  return <Outlet />;
}
