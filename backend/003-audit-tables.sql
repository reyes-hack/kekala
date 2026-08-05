-- TABLAS PARA AUDITORÍA DE INVENTARIO (CONTEO CIEGO)

CREATE TABLE IF NOT EXISTS public.audit_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    started_by UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.audit_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.audit_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    expected_stock NUMERIC(12,2) NOT NULL, -- Guardamos la "foto" de lo que el sistema esperaba en ese momento
    counted_stock NUMERIC(12,2),
    difference NUMERIC(12,2),
    evidence_photo_url TEXT,
    counted_at TIMESTAMPTZ
);

-- Habilitar RLS
ALTER TABLE public.audit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_counts ENABLE ROW LEVEL SECURITY;

-- Políticas temporales para desarrollo (hasta que Ángel configure el hook JWT)
CREATE POLICY "Permitir todo temporalmente a sesiones" ON public.audit_sessions FOR ALL USING (true);
CREATE POLICY "Permitir todo temporalmente a counts" ON public.audit_counts FOR ALL USING (true);
