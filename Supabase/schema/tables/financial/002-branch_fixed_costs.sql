BEGIN;

CREATE TABLE IF NOT EXISTS public.branch_fixed_costs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    branch_id UUID NOT NULL,

    month_year DATE NOT NULL,

    category TEXT NOT NULL,

    concept TEXT NOT NULL,

    amount NUMERIC(12,2) NOT NULL,

    notes TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_branch_fixed_costs_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_branch_fixed_costs_branch
        FOREIGN KEY (branch_id)
        REFERENCES public.branches(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_branch_fixed_costs_amount
        CHECK (
            amount >= 0
        ),

    CONSTRAINT chk_branch_fixed_costs_category
        CHECK (
            category IN (
                'RENTA',
                'NOMINA',
                'SERVICIOS',
                'MARKETING',
                'MANTENIMIENTO',
                'SEGUROS',
                'IMPUESTOS',
                'OTROS'
            )
        ),

    CONSTRAINT chk_branch_fixed_costs_metadata
        CHECK (
            jsonb_typeof(metadata) = 'object'
        )

);

------------------------------------------------------------
-- Índices
------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_branch_fixed_costs_organization
ON public.branch_fixed_costs(organization_id);

CREATE INDEX IF NOT EXISTS idx_branch_fixed_costs_branch
ON public.branch_fixed_costs(branch_id);

CREATE INDEX IF NOT EXISTS idx_branch_fixed_costs_month
ON public.branch_fixed_costs(month_year);

CREATE INDEX IF NOT EXISTS idx_branch_fixed_costs_category
ON public.branch_fixed_costs(category);

CREATE INDEX IF NOT EXISTS idx_branch_fixed_costs_branch_month
ON public.branch_fixed_costs(branch_id, month_year);

------------------------------------------------------------
-- Trigger updated_at
------------------------------------------------------------

CREATE TRIGGER trg_branch_fixed_costs_updated_at
BEFORE UPDATE
ON public.branch_fixed_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

------------------------------------------------------------
-- Comentarios
------------------------------------------------------------

COMMENT ON TABLE public.branch_fixed_costs IS
'Costos fijos mensuales registrados por sucursal para análisis financiero.';

COMMENT ON COLUMN public.branch_fixed_costs.id IS
'Identificador único del costo fijo.';

COMMENT ON COLUMN public.branch_fixed_costs.organization_id IS
'Organización propietaria del registro.';

COMMENT ON COLUMN public.branch_fixed_costs.branch_id IS
'Sucursal a la que pertenece el costo fijo.';

COMMENT ON COLUMN public.branch_fixed_costs.month_year IS
'Mes correspondiente al costo fijo.';

COMMENT ON COLUMN public.branch_fixed_costs.category IS
'Categoría del costo fijo.';

COMMENT ON COLUMN public.branch_fixed_costs.concept IS
'Concepto específico del costo fijo.';

COMMENT ON COLUMN public.branch_fixed_costs.amount IS
'Importe mensual del costo fijo.';

COMMENT ON COLUMN public.branch_fixed_costs.notes IS
'Observaciones adicionales.';

COMMENT ON COLUMN public.branch_fixed_costs.metadata IS
'Información adicional en formato JSON.';

COMMENT ON COLUMN public.branch_fixed_costs.created_at IS
'Fecha y hora de creación del registro.';

COMMENT ON COLUMN public.branch_fixed_costs.updated_at IS
'Fecha y hora de la última actualización del registro.';

COMMIT;