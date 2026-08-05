import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { Inventory } from './pages/Inventory';
import { Sales } from './pages/Sales';
import { Recetario } from './pages/Recetario';
import { ComingSoon } from './pages/ComingSoon';
import './index.css';

/* ════════════════════════════════════════════
   MÓDULO DE ENRUTAMIENTO — KEKALA ERP
   ════════════════════════════════════════════ */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/inventario" replace />} />
          <Route path="inventario" element={<Inventory />} />
          <Route path="sucursales" element={<ComingSoon />} />
          <Route path="ventas" element={<Sales />} />
          <Route path="recetario" element={<Recetario />} />
          <Route path="gastos" element={<ComingSoon />} />
          <Route path="mermas" element={<ComingSoon />} />
          <Route path="*" element={<Navigate to="/inventario" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
