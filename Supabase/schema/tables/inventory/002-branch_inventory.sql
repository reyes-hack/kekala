BEGIN;

CREATE TABLE IF NOT EXISTS public.branch_inventory (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Relaciones
    ------------------------------------------------------------------

    organization_id UUID NOT NULL,

    branch_id UUID NOT NULL,

    product_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Existencias
    ------------------------------------------------------------------

    current_stock NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    minimum_stock NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    maximum_stock NUMERIC(12,2),

    ------------------------------------------------------------------
    -- Estado
    ------------------------------------------------------------------

    is_active BOOLEAN NOT NULL
        DEFAULT TRUE,

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

    CONSTRAINT fk_branch_inventory_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id),

    CONSTRAINT fk_branch_inventory_branch
        FOREIGN KEY (branch_id)
        REFERENCES public.branches(id),

    CONSTRAINT fk_branch_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES public.products(id),

    ------------------------------------------------------------------
    -- Unique
    ------------------------------------------------------------------

    CONSTRAINT uq_branch_inventory_branch_product
        UNIQUE (
            branch_id,
            product_id
        ),

    ------------------------------------------------------------------
    -- Checks
    ------------------------------------------------------------------

    CONSTRAINT chk_branch_inventory_current_stock
        CHECK (
            current_stock >= 0
        ),

    CONSTRAINT chk_branch_inventory_minimum_stock
        CHECK (
            minimum_stock >= 0
        ),

    CONSTRAINT chk_branch_inventory_maximum_stock
        CHECK (
            maximum_stock IS NULL
            OR maximum_stock >= minimum_stock
        )

);

COMMIT;