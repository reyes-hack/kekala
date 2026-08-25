import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, AlertCircle, LogOut, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export function Asistencia({ onClose }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState(null);
  const [attendanceLog, setAttendanceLog] = useState(null);
  const [actionType, setActionType] = useState('LOADING'); // LOADING, CHECK_IN, CHECK_OUT, FINISHED

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photoData, setPhotoData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, branch_id, organization_id')
        .eq('id', session.user.id)
        .single();
      
      setProfile(prof);

      // Check current status
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: log } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('profile_id', session.user.id)
        .eq('log_date', todayStr)
        .maybeSingle();

      setAttendanceLog(log);

      if (!log) {
        setActionType('CHECK_IN');
      } else if (log && !log.check_out_at) {
        setActionType('CHECK_OUT');
      } else {
        setActionType('FINISHED');
      }
    };
    init();

    return () => {
      stopCamera();
    };
  }, [navigate]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setErrorMsg("No se pudo acceder a la cámara. Por favor permite el acceso.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (profile && !photoData && !success && (actionType === 'CHECK_IN' || actionType === 'CHECK_OUT')) {
      startCamera();
    }
  }, [profile, photoData, success, actionType]);

  const takePhoto = (e) => {
    e.preventDefault();
    if (!videoRef.current || !canvasRef.current) return;
    
    if (pin.length !== 6) {
      setErrorMsg("Debes ingresar tu NIP de 6 dígitos.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setPhotoData(dataUrl);
    stopCamera();
    setErrorMsg('');
  };

  const retakePhoto = () => {
    setPhotoData(null);
    startCamera();
  };

  const dataURLtoBlob = (dataurl) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  };

  const submitAttendance = async () => {
    if (!photoData || pin.length !== 6 || !profile) return;
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      // 1. Verify PIN
      const { data: authData, error: authError } = await supabase.functions.invoke('iniciar_sesion_cajero', {
        body: { profile_id: profile.id, pin: pin }
      });

      if (authError) throw new Error("NIP Incorrecto.");

      // 2. Upload photo
      const blob = dataURLtoBlob(photoData);
      const today = new Date().toISOString().split('T')[0];
      const suffix = actionType === 'CHECK_OUT' ? '_out' : '';
      const fileName = `${today}/${profile.id}${suffix}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attendance-photos')
        .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });
        
      if (uploadError) throw new Error("Error al subir foto: " + uploadError.message);
      
      const photoUrl = uploadData.path;
      const nowIso = new Date().toISOString();

      if (actionType === 'CHECK_IN') {
        // Find shift
        const now = new Date();
        let dayOfWeek = now.getDay() - 1;
        if (dayOfWeek === -1) dayOfWeek = 6;
        
        const { data: assignment } = await supabase
          .from('shift_assignments')
          .select('shift_id, shifts(start_time)')
          .eq('profile_id', profile.id)
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true)
          .single();

        let status = 'ON_TIME';
        let shiftId = null;
        if (assignment) {
          shiftId = assignment.shift_id;
          const shiftStartStr = assignment.shifts?.start_time; 
          if (shiftStartStr) {
            const shiftStart = new Date();
            const [h, m] = shiftStartStr.split(':');
            shiftStart.setHours(parseInt(h), parseInt(m), 0, 0);
            const diffMs = now.getTime() - shiftStart.getTime();
            const diffMins = diffMs / 60000;
            if (diffMins > 15) status = 'LATE';
          }
        }

        const { error: logError } = await supabase.from('attendance_logs').insert({
          organization_id: profile.organization_id,
          branch_id: profile.branch_id,
          profile_id: profile.id,
          shift_id: shiftId,
          log_date: today,
          check_in_at: nowIso,
          photo_url: photoUrl,
          status: status
        });
        if (logError) throw new Error("Error al registrar entrada: " + logError.message);

      } else if (actionType === 'CHECK_OUT') {
        const currentNotes = attendanceLog.notes ? attendanceLog.notes + ' | ' : '';
        const { error: logError } = await supabase.from('attendance_logs')
          .update({
            check_out_at: nowIso,
            notes: currentNotes + 'Foto salida: ' + photoUrl
          })
          .eq('id', attendanceLog.id);
        if (logError) throw new Error("Error al registrar salida: " + logError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        if (onClose) onClose();
        else navigate('/');
      }, 2000);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  if (actionType === 'LOADING' || !profile) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        Cargando módulo de asistencia...
      </div>
    );
  }

  const containerStyle = onClose 
    ? { width: '100%' } // Inside a modal
    : { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', padding: '24px' };

  return (
    <div style={containerStyle}>
      <div className={onClose ? '' : "neo-surface fade-in"} style={{ width: '100%', maxWidth: '440px', margin: '0 auto', padding: onClose ? '0' : '32px', borderRadius: '24px', textAlign: 'center' }}>
        
        {onClose && (
          <button onClick={onClose} className="neo-btn" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={16} style={{ transform: 'rotate(180deg)' }} /> Volver al Menú
          </button>
        )}
        
        {success ? (
          <div className="fade-in" style={{ padding: '20px 0' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)' }}>
              <CheckCircle2 color="white" size={40} />
            </div>
            <h2 style={{ margin: '0 0 8px 0' }}>¡{actionType === 'CHECK_IN' ? 'Entrada' : 'Salida'} Registrada!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Gracias, {profile.first_name}.</p>
          </div>
        ) : actionType === 'FINISHED' ? (
          <div className="fade-in" style={{ padding: '20px 0' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <CheckCircle2 color="var(--text-muted)" size={40} />
            </div>
            <h2 style={{ margin: '0 0 8px 0' }}>Turno Finalizado</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Ya has registrado tu entrada y salida el día de hoy.</p>
            <button onClick={() => onClose ? onClose() : navigate('/')} className="neo-btn" style={{ marginTop: '24px' }}>
              Volver al Inicio
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {actionType === 'CHECK_IN' ? <LogIn size={24} /> : <LogOut size={24} />}
              Registro de {actionType === 'CHECK_IN' ? 'Entrada' : 'Salida'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
              Hola {profile.first_name}. {actionType === 'CHECK_IN' ? 'Inicia' : 'Finaliza'} tu turno tomando una foto e ingresando tu NIP.
            </p>

            <form onSubmit={photoData ? (e) => { e.preventDefault(); submitAttendance(); } : takePhoto}>
              <div style={{ marginBottom: '24px', position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
                {photoData ? (
                  <img src={photoData} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>

              {!photoData && (
                <div style={{ marginBottom: '24px' }}>
                  <input
                    type="password"
                    placeholder="Tu NIP de 6 dígitos"
                    className="neo-input"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.25rem', padding: '16px' }}
                    required
                  />
                </div>
              )}

              {errorMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.875rem' }}>
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              {photoData ? (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="neo-btn" style={{ flex: 1 }} onClick={retakePhoto} disabled={loading}>
                    Repetir Foto
                  </button>
                  <button type="submit" className="neo-btn primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? 'Subiendo...' : 'Confirmar'}
                  </button>
                </div>
              ) : (
                <button type="submit" className="neo-btn primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <Camera size={20} /> Tomar Foto de {actionType === 'CHECK_IN' ? 'Entrada' : 'Salida'}
                </button>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
