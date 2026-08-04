BEGIN;

CREATE TABLE IF NOT EXISTS public.waste_items (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Relaciones
    ------------------------------------------------------------------

    organization_id UUID NOT NULL,

    waste_record_id UUID NOT NULL,

    product_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Cantidades
    ------------------------------------------------------------------

    quantity NUMERIC(12,2) NOT NULL,

    unit_cost_at_time NUMERIC(12,2) NOT NULL,

    subtotal_loss NUMERIC(12,2) NOT NULL,

    ------------------------------------------------------------------
    -- Auditoría
    ------------------------------------------------------------------

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    ------------------------------------------------------------------
    -- Foreign Keys
    ------------------------------------------------------------------

    CONSTRAINT fk_waste_items_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_waste_items_record
        FOREIGN KEY (waste_record_id)
        REFERENCES public.waste_records(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_waste_items_product
        FOREIGN KEY (product_id)
        REFERENCES public.products(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    ------------------------------------------------------------------
    -- Restricciones
    ------------------------------------------------------------------

    CONSTRAINT uq_waste_item_product
        UNIQUE (
            waste_record_id,
            product_id
        ),

    CONSTRAINT chk_waste_items_quantity
        CHECK (
            quantity > 0
        ),

    CONSTRAINT chk_waste_items_unit_cost
        CHECK (
            unit_cost_at_time >= 0
        ),

    CONSTRAINT chk_waste_items_subtotal
        CHECK (
            subtotal_loss >= 0
        )

);

COMMIT;