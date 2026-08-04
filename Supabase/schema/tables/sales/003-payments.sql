BEGIN;

CREATE TABLE IF NOT EXISTS public.payments (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Organización
    ------------------------------------------------------------------

    organization_id UUID NOT NULL,

    branch_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Relaciones
    ------------------------------------------------------------------

    sale_id UUID NOT NULL,

    payment_method_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Importes
    ------------------------------------------------------------------

    amount NUMERIC(12,2) NOT NULL,

    received_amount NUMERIC(12,2),

    change_amount NUMERIC(12,2)
        DEFAULT 0,

    ------------------------------------------------------------------
    -- Referencias
    ------------------------------------------------------------------

    payment_reference TEXT,

    authorization_code TEXT,

    ------------------------------------------------------------------
    -- Información adicional
    ------------------------------------------------------------------

    notes TEXT,

    metadata JSONB NOT NULL
        DEFAULT '{}'::jsonb,

    ------------------------------------------------------------------
    -- Auditoría
    ------------------------------------------------------------------

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    ------------------------------------------------------------------
    -- Foreign Keys
    ------------------------------------------------------------------

    CONSTRAINT fk_payments_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_payments_branch
        FOREIGN KEY (branch_id)
        REFERENCES public.branches(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_payments_sale
        FOREIGN KEY (sale_id)
        REFERENCES public.sales(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_payments_payment_method
        FOREIGN KEY (payment_method_id)
        REFERENCES public.catalog_values(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    ------------------------------------------------------------------
    -- Validaciones
    ------------------------------------------------------------------

    CONSTRAINT chk_payments_amount
        CHECK (amount > 0),

    CONSTRAINT chk_payments_received
        CHECK (
            received_amount IS NULL
            OR received_amount >= amount
        ),

    CONSTRAINT chk_payments_change
        CHECK (
            change_amount >= 0
        ),

    CONSTRAINT chk_payments_metadata
        CHECK (
            jsonb_typeof(metadata) = 'object'
        )

);

COMMIT;