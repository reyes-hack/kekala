-- =========================================================================================
-- SCRIPT DE SEGURIDAD: 016-cash-closures-rls
-- DESCRIPCIÓN: 
-- Este script configura la Seguridad a Nivel de Fila (Row Level Security - RLS)
-- para la tabla 'cash_closures'. Es estrictamente necesario para que la aplicación
-- frontend (React) pueda insertar registros cuando los empleados o administradores
-- realizan los cortes diarios. Sin esta política, todas las consultas desde el cliente
-- rebotarán con un error de violación de seguridad o acceso denegado (42501).
-- =========================================================================================

-- 1. Aseguramos de que RLS esté activo explícitamente en la tabla
ALTER TABLE public.cash_closures ENABLE ROW LEVEL SECURITY;

-- 2. Creamos la política general
-- Nota técnica: Para simplificar el prototipo/MVP actual de la aplicación, esta 
-- política permite que cualquier usuario autenticado u operación inserte y consulte cortes.
-- En versiones de producción más robustas, el "USING (true)" se reemplazaría por 
-- filtros estrictos de rol, como: "USING (auth.uid() = opened_by)"
CREATE POLICY "Allow all operations on cash_closures"
    ON public.cash_closures
    FOR ALL
    USING (true)
    WITH CHECK (true);
