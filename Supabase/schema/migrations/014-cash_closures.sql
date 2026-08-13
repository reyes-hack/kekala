BEGIN;

-- =========================================================================================
-- MIGRATION: 014-cash_closures
-- DESCRIPCIÓN: 
-- Crea o actualiza la tabla 'cash_closures' para registrar los cortes de caja diarios.
-- Esta tabla está diseñada para reflejar fielmente los montos y tickets extraídos 
-- del sistema POS (Foodbot) durante el proceso de cierre o conciliación.
-- =========================================================================================

CREATE TABLE IF NOT EXISTS public.cash_closures (
    -- Identificadores únicos y relaciones
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL, -- Organización a la que pertenece el corte
    branch_id UUID NOT NULL,       -- Sucursal donde se realiza el corte
    close_date DATE NOT NULL,      -- Fecha del día del corte (Ej: 2024-05-15)
    
    -- Usuarios responsables del flujo de caja
    opened_by UUID,                -- Usuario que realizó la apertura de caja
    closed_by UUID,                -- Usuario que realiza el cierre/auditoría
    
    -- ======================================================================
    -- CAMPOS FINANCIEROS (Basados en el ticket real del sistema Foodbot)
    -- ======================================================================
    
    -- Fondo inicial (dinero dejado del día anterior)
    opening_cash NUMERIC(12,2) DEFAULT 0,
    
    -- Efectivo declarado (lo que el empleado dice tener en físico al cerrar)
    declared_cash NUMERIC(12,2) DEFAULT 0,
    
    -- Ventas totales cobradas mediante Terminal Bancaria (Tarjetas)
    pos_terminal_sales NUMERIC(12,2) DEFAULT 0,
    
    -- Ventas totales cobradas en Efectivo
    cash_sales NUMERIC(12,2) DEFAULT 0,
    
    -- Entradas de efectivo manuales (pagos varios, ingresos externos, etc.)
    cash_ins NUMERIC(12,2) DEFAULT 0,
    
    -- Salidas de efectivo manuales (pagos a proveedores, gastos del día, etc.)
    cash_outs NUMERIC(12,2) DEFAULT 0,
    
    -- Conteo total de tickets/notas de venta procesados en el día
    total_tickets INTEGER DEFAULT 0,
    
    -- Estado actual del corte (Ej: PENDING, APPROVED, DISCREPANCY) referenciado al catálogo
    status_id UUID,
    
    -- Fecha y hora exacta de creación del registro
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================================
-- ACTUALIZACIÓN DE ESQUEMA (SAFE-UPDATE)
-- En caso de que la tabla 'cash_closures' ya exista por migraciones anteriores,
-- nos aseguramos de inyectar las columnas nuevas sin borrar la tabla existente.
-- =========================================================================================
ALTER TABLE public.cash_closures
ADD COLUMN IF NOT EXISTS close_date DATE,
ADD COLUMN IF NOT EXISTS opened_by UUID,
ADD COLUMN IF NOT EXISTS opening_cash NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS declared_cash NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pos_terminal_sales NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash_sales NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash_ins NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash_outs NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tickets INTEGER DEFAULT 0;

COMMIT;
