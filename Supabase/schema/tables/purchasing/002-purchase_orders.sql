BEGIN;

CREATE TABLE IF NOT EXISTS public.purchase_orders (

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

    supplier_id UUID NOT NULL,

    created_by UUID NOT NULL,

    ------------------------------------------------------------------
    -- Identificación
    ------------------------------------------------------------------

    purchase_order_number TEXT NOT NULL,

    ------------------------------------------------------------------
    -- Estado
    ------------------------------------------------------------------

    status_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Fechas
    ------------------------------------------------------------------

    expected_date DATE,

    received_date DATE,

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

    CONSTRAINT fk_purchase_orders_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_purchase_orders_branch
        FOREIGN KEY (branch_id)
        REFERENCES public.branches(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_purchase_orders_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES public.suppliers(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_purchase_orders_created_by
        FOREIGN KEY (created_by)
        REFERENCES public.profiles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_purchase_orders_status
        FOREIGN KEY (status_id)
        REFERENCES public.catalog_values(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    ------------------------------------------------------------------
    -- Restricciones
    ------------------------------------------------------------------

    CONSTRAINT uq_purchase_order_number
        UNIQUE (
            organization_id,
            purchase_order_number
        ),

    CONSTRAINT chk_purchase_orders_subtotal
        CHECK (subtotal >= 0),

    CONSTRAINT chk_purchase_orders_discount
        CHECK (discount_amount >= 0),

    CONSTRAINT chk_purchase_orders_tax
        CHECK (tax_amount >= 0),

    CONSTRAINT chk_purchase_orders_total
        CHECK (total_amount >= 0),

    CONSTRAINT chk_purchase_orders_metadata
        CHECK (
            jsonb_typeof(metadata) = 'object'
        )

);

COMMIT;