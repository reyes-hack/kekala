-- Eliminar tabla si existe para recrear limpia
DROP TABLE IF EXISTS public.expenses CASCADE;

-- Crear tabla de Gastos
CREATE TABLE public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    concept TEXT NOT NULL,
    establishment TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    folio TEXT,
    payment_method TEXT NOT NULL,
    responsible TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS (Permitir todo temporalmente o para acceso anónimo/público)
CREATE POLICY "Allow all operations on expenses"
    ON public.expenses
    FOR ALL
    USING (true)
    WITH CHECK (true);
