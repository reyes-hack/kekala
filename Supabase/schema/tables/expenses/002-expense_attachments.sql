BEGIN;

CREATE TABLE IF NOT EXISTS public.expense_attachments (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Relaciones
    ------------------------------------------------------------------

    organization_id UUID NOT NULL,

    expense_id UUID NOT NULL,

    uploaded_by UUID,

    ------------------------------------------------------------------
    -- Archivo
    ------------------------------------------------------------------

    file_name TEXT NOT NULL,

    file_url TEXT NOT NULL,

    file_type TEXT NOT NULL,

    file_size BIGINT,

    ------------------------------------------------------------------
    -- Información adicional
    ------------------------------------------------------------------

    metadata JSONB NOT NULL
        DEFAULT '{}'::jsonb,

    ------------------------------------------------------------------
    -- Auditoría
    ------------------------------------------------------------------

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    ------------------------------------------------------------------
    -- Foreign Keys
    ------------------------------------------------------------------

    CONSTRAINT fk_expense_attachments_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_expense_attachments_expense
        FOREIGN KEY (expense_id)
        REFERENCES public.expenses(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_expense_attachments_uploaded_by
        FOREIGN KEY (uploaded_by)
        REFERENCES public.profiles(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    ------------------------------------------------------------------
    -- Restricciones
    ------------------------------------------------------------------

    CONSTRAINT chk_expense_attachments_metadata
        CHECK (
            jsonb_typeof(metadata) = 'object'
        ),

    CONSTRAINT chk_expense_attachments_size
        CHECK (
            file_size IS NULL
            OR file_size >= 0
        )

);

COMMIT;