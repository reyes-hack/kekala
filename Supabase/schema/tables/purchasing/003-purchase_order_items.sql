BEGIN;

CREATE TABLE IF NOT EXISTS public.purchase_order_items (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Relaciones
    ------------------------------------------------------------------

    organization_id UUID NOT NULL,

    purchase_order_id UUID NOT NULL,

    product_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Cantidades
    ------------------------------------------------------------------

    quantity_ordered NUMERIC(12,2) NOT NULL,

    quantity_received NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    ------------------------------------------------------------------
    -- Costos
    ------------------------------------------------------------------

    unit_cost NUMERIC(12,2) NOT NULL,

    subtotal NUMERIC(12,2) NOT NULL,

    tax_amount NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    total_amount NUMERIC(12,2) NOT NULL,

    ------------------------------------------------------------------
    -- Auditoría
    ------------------------------------------------------------------

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    ------------------------------------------------------------------
    -- Foreign Keys
    ------------------------------------------------------------------

    CONSTRAINT fk_purchase_order_items_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_purchase_order_items_purchase_order
        FOREIGN KEY (purchase_order_id)
        REFERENCES public.purchase_orders(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_purchase_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES public.products(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    ------------------------------------------------------------------
    -- Restricciones
    ------------------------------------------------------------------

    CONSTRAINT uq_purchase_order_item_product
        UNIQUE (
            purchase_order_id,
            product_id
        ),

    CONSTRAINT chk_purchase_order_items_quantity_ordered
        CHECK (quantity_ordered > 0),

    CONSTRAINT chk_purchase_order_items_quantity_received
        CHECK (
            quantity_received >= 0
            AND quantity_received <= quantity_ordered
        ),

    CONSTRAINT chk_purchase_order_items_unit_cost
        CHECK (unit_cost >= 0),

    CONSTRAINT chk_purchase_order_items_subtotal
        CHECK (subtotal >= 0),

    CONSTRAINT chk_purchase_order_items_tax
        CHECK (tax_amount >= 0),

    CONSTRAINT chk_purchase_order_items_total
        CHECK (total_amount >= 0)

);

COMMIT;