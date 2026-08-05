-- Eliminar la tabla anterior si existe para evitar conflictos con esquemas viejos
DROP TABLE IF EXISTS public.purchase_orders CASCADE;

-- Crear tabla de Órdenes de Compra
CREATE TABLE public.purchase_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ENVIADA',
    justification TEXT,
    order_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar validación para que el status sólo pueda ser uno de los permitidos
ALTER TABLE public.purchase_orders ADD CONSTRAINT check_status 
    CHECK (status IN ('ENVIADA', 'ACEPTADA', 'RECHAZADA', 'ENTREGADA'));

-- Habilitar RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS (Permitir todo temporalmente o para acceso anónimo/público)
CREATE POLICY "Allow all operations on purchase_orders"
    ON public.purchase_orders
    FOR ALL
    USING (true)
    WITH CHECK (true);
