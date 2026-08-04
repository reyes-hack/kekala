BEGIN;

CREATE TABLE IF NOT EXISTS public.sales (

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
    -- Folio
    ------------------------------------------------------------------

    sale_number TEXT NOT NULL,

    ------------------------------------------------------------------
    -- Cliente
    ------------------------------------------------------------------

    customer_id UUID,

    ------------------------------------------------------------------
    -- Usuario
    ------------------------------------------------------------------

    created_by UUID NOT NULL,

    ------------------------------------------------------------------
    -- Estado
    ------------------------------------------------------------------

    status_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Importes
    ------------------------------------------------------------------

    subtotal NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    discount_amount NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    tax_amount NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    total_amount NUMERIC(12,2) NOT NULL
        DEFAULT 0,

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

    CONSTRAINT fk_sales_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_sales_branch
        FOREIGN KEY (branch_id)
        REFERENCES public.branches(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_sales_created_by
        FOREIGN KEY (created_by)
        REFERENCES public.profiles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_sales_status
        FOREIGN KEY (status_id)
        REFERENCES public.catalog_values(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    ------------------------------------------------------------------
    -- Restricciones
    ------------------------------------------------------------------

    CONSTRAINT uq_sales_number
        UNIQUE (
            organization_id,
            sale_number
        ),

    CONSTRAINT chk_sales_subtotal
        CHECK (subtotal >= 0),

    CONSTRAINT chk_sales_discount
        CHECK (discount_amount >= 0),

    CONSTRAINT chk_sales_tax
        CHECK (tax_amount >= 0),

    CONSTRAINT chk_sales_total
        CHECK (total_amount >= 0),

    CONSTRAINT chk_sales_metadata
        CHECK (
            jsonb_typeof(metadata) = 'object'
        )

);

COMMIT;