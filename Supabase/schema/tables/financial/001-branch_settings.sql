BEGIN;

CREATE TABLE IF NOT EXISTS public.branch_settings (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    branch_id UUID NOT NULL,

    card_commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_branch_settings_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_branch_settings_branch
        FOREIGN KEY (branch_id)
        REFERENCES public.branches(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_branch_settings_branch
        UNIQUE (branch_id),

    CONSTRAINT chk_branch_settings_commission
        CHECK (
            card_commission_percentage >= 0
            AND
            card_commission_percentage <= 100
        ),

    CONSTRAINT chk_branch_settings_metadata
        CHECK (
            jsonb_typeof(metadata) = 'object'
        )

);

------------------------------------------------------------
-- Índices
------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_branch_settings_organization
ON public.branch_settings(organization_id);

------------------------------------------------------------
-- Trigger updated_at
------------------------------------------------------------

CREATE TRIGGER trg_branch_settings_updated_at
BEFORE UPDATE
ON public.branch_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

------------------------------------------------------------
-- Comentarios
------------------------------------------------------------

COMMENT ON TABLE public.branch_settings IS
'Configuraciones generales por sucursal que no dependen de un periodo de tiempo.';

COMMENT ON COLUMN public.branch_settings.id IS
'Identificador único de la configuración.';

COMMENT ON COLUMN public.branch_settings.organization_id IS
'Organización propietaria de la configuración.';

COMMENT ON COLUMN public.branch_settings.branch_id IS
'Sucursal a la que pertenece la configuración.';

COMMENT ON COLUMN public.branch_settings.card_commission_percentage IS
'Porcentaje de comisión aplicado a las ventas realizadas con tarjeta.';

COMMENT ON COLUMN public.branch_settings.metadata IS
'Configuraciones adicionales almacenadas en formato JSON.';

COMMENT ON COLUMN public.branch_settings.created_at IS
'Fecha y hora de creación del registro.';

COMMENT ON COLUMN public.branch_settings.updated_at IS
'Fecha y hora de la última actualización del registro.';

COMMIT;