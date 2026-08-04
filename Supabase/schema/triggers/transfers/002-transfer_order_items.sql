BEGIN;

CREATE TABLE IF NOT EXISTS public.transfer_order_items (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Relaciones
    ------------------------------------------------------------------

    organization_id UUID NOT NULL,

    transfer_order_id UUID NOT NULL,

    product_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Cantidades
    ------------------------------------------------------------------

    quantity_requested NUMERIC(12,2) NOT NULL,

    quantity_sent NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    quantity_received NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    ------------------------------------------------------------------
    -- Auditoría
    ------------------------------------------------------------------

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    ------------------------------------------------------------------
    -- Foreign Keys
    ------------------------------------------------------------------

    CONSTRAINT fk_transfer_items_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_transfer_items_order
        FOREIGN KEY (transfer_order_id)
        REFERENCES public.transfer_orders(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_transfer_items_product
        FOREIGN KEY (product_id)
        REFERENCES public.products(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    ------------------------------------------------------------------
    -- Restricciones
    ------------------------------------------------------------------

    CONSTRAINT uq_transfer_item_product
        UNIQUE (
            transfer_order_id,
            product_id
        ),

    CONSTRAINT chk_transfer_quantity_requested
        CHECK (
            quantity_requested > 0
        ),

    CONSTRAINT chk_transfer_quantity_sent
        CHECK (
            quantity_sent >= 0
        ),

    CONSTRAINT chk_transfer_quantity_received
        CHECK (
            quantity_received >= 0
        ),

    CONSTRAINT chk_transfer_sent_limit
        CHECK (
            quantity_sent <= quantity_requested
        ),

    CONSTRAINT chk_transfer_received_limit
        CHECK (
            quantity_received <= quantity_sent
        )

);

COMMIT;