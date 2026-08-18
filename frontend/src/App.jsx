import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Sucursales } from './pages/Sucursales';
import { Auditoria } from './pages/Auditoria';
import { Sales } from './pages/Sales';
import { Recetario } from './pages/Recetario';
import { Purchases } from './pages/Purchases';
import { Mermas } from './pages/Mermas';
import { CortesDeCaja } from './pages/CortesDeCaja';
import { ComingSoon } from './pages/ComingSoon';
import './index.css';
import { Configuracion } from './pages/Configuracion';
import { LoginNIP } from './pages/LoginNIP';
import { LoginAdmin } from './pages/LoginAdmin';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Asistencia } from './pages/Asistencia';
import { AsistenciaAdmin } from './pages/AsistenciaAdmin';
import { MisHorarios } from './pages/MisHorarios';

/* ════════════════════════════════════════════
   MÓDULO DE ENRUTAMIENTO — KEKALA ERP
   ════════════════════════════════════════════ */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginNIP />} />
        <Route path="/login-admin" element={<LoginAdmin />} />
        
        {/* Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/asistencia" element={<Asistencia />} />
          <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventario" element={<Inventory />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="ventas" element={<Sales />} />
          <Route path="recetario" element={<Recetario />} />
          <Route path="auditoria" element={<Auditoria />} />
          <Route path="gastos" element={<Purchases />} />
          <Route path="mermas" element={<Mermas />} />
          <Route path="cortes" element={<CortesDeCaja />} />
          <Route path="horarios" element={<MisHorarios />} />
          <Route path="asistencia-admin" element={<AsistenciaAdmin />} />
          <Route path="*" element={<Navigate to="/inventario" replace />} />
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>
  );
}

export default App;
