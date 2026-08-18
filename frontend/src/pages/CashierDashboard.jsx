import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Banknote, ShieldCheck, Calculator, CalendarClock } from 'lucide-react';

export function CashierDashboard() {
  const navigate = useNavigate();

  const modules = [
    {
      id: 'mermas',
      title: 'Reportes de Mermas',
      description: 'Registrar paletas dañadas, defectuosas o caducadas.',
      icon: Trash2,
      color: '#ef4444',
      path: '/mermas'
    },
    {
      id: 'gastos',
      title: 'Compras y Gastos',
      description: 'Registrar facturas, tickets y egresos de caja chica.',
      icon: Banknote,
      color: '#f59e0b',
      path: '/gastos'
    },
    {
      id: 'auditoria',
      title: 'Auditoría de Inventario',
      description: 'Realizar un conteo físico ciego de la sucursal.',
      icon: ShieldCheck,
      color: '#10b981',
      path: '/auditoria'
    },
    {
      id: 'cortes',
      title: 'Corte de Caja',
      description: 'Realizar el cierre de turno y cuadre de efectivo.',
      icon: Calculator,
      color: '#1a4f99',
      path: '/cortes'
    },
    {
      id: 'horarios',
      title: 'Mis Horarios',
      description: 'Consultar mis turnos asignados de la semana.',
      icon: CalendarClock,
      color: '#8b5cf6',
      path: '/horarios'
    }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Selecciona una Operación
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
          Toca una de las siguientes opciones para continuar
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        padding: '0 12px'
      }}>
        {modules.map(mod => (
          <button
            key={mod.id}
            onClick={() => navigate(mod.path)}
            className="glass-panel"
            style={{
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              border: `2px solid transparent`,
              transition: 'all 0.2s ease-in-out',
              textDecoration: 'none'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = mod.color;
              e.currentTarget.style.boxShadow = `0 12px 24px ${mod.color}33`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '24px', 
              background: `${mod.color}15`, 
              color: mod.color,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <mod.icon size={40} strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              {mod.title}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0, lineHeight: 1.4 }}>
              {mod.description}
            </p>
          </button>
        ))}
      </div>

    </div>
  );
}
