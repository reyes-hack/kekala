BEGIN;

CREATE TABLE IF NOT EXISTS public.inventory_movements (

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

    movement_type_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Movimiento
    ------------------------------------------------------------------

    quantity NUMERIC(12,2) NOT NULL,

    previous_stock NUMERIC(12,2),

    current_stock NUMERIC(12,2),

    ------------------------------------------------------------------
    -- Documento origen
    ------------------------------------------------------------------

    reference_type TEXT,

    reference_id UUID,

    ------------------------------------------------------------------
    -- Auditoría
    ------------------------------------------------------------------

    notes TEXT,

    created_by UUID,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    ------------------------------------------------------------------
    -- Foreign Keys
    ------------------------------------------------------------------

    CONSTRAINT fk_inventory_movements_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id),

    CONSTRAINT fk_inventory_movements_branch
        FOREIGN KEY (branch_id)
        REFERENCES public.branches(id),

    CONSTRAINT fk_inventory_movements_product
        FOREIGN KEY (product_id)
        REFERENCES public.products(id),

    CONSTRAINT fk_inventory_movements_movement_type
        FOREIGN KEY (movement_type_id)
        REFERENCES public.catalog_values(id),

    ------------------------------------------------------------------
    -- Checks
    ------------------------------------------------------------------

    CONSTRAINT chk_inventory_movements_quantity
        CHECK (
            quantity <> 0
        ),

    CONSTRAINT chk_inventory_movements_reference_type
        CHECK (
            reference_type IS NULL
            OR reference_type = UPPER(reference_type)
        ),

    CONSTRAINT chk_inventory_movements_previous_stock
        CHECK (
            previous_stock IS NULL
            OR previous_stock >= 0
        ),

    CONSTRAINT chk_inventory_movements_current_stock
        CHECK (
            current_stock IS NULL
            OR current_stock >= 0
        )

);

COMMIT;