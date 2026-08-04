BEGIN;

CREATE TABLE IF NOT EXISTS public.sale_items (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Relaciones
    ------------------------------------------------------------------

    organization_id UUID NOT NULL,

    sale_id UUID NOT NULL,

    product_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Cantidades
    ------------------------------------------------------------------

    quantity NUMERIC(12,2) NOT NULL,

    ------------------------------------------------------------------
    -- Precios históricos
    ------------------------------------------------------------------

    unit_cost NUMERIC(12,2) NOT NULL,

    unit_price NUMERIC(12,2) NOT NULL,

    discount_amount NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    tax_amount NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    subtotal NUMERIC(12,2) NOT NULL,

    total_amount NUMERIC(12,2) NOT NULL,

    ------------------------------------------------------------------
    -- Auditoría
    ------------------------------------------------------------------

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    ------------------------------------------------------------------
    -- Foreign Keys
    ------------------------------------------------------------------

    CONSTRAINT fk_sale_items_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_sale_items_sale
        FOREIGN KEY (sale_id)
        REFERENCES public.sales(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_sale_items_product
        FOREIGN KEY (product_id)
        REFERENCES public.products(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    ------------------------------------------------------------------
    -- Validaciones
    ------------------------------------------------------------------

    CONSTRAINT chk_sale_items_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_sale_items_unit_cost
        CHECK (unit_cost >= 0),

    CONSTRAINT chk_sale_items_unit_price
        CHECK (unit_price >= 0),

    CONSTRAINT chk_sale_items_discount
        CHECK (discount_amount >= 0),

    CONSTRAINT chk_sale_items_tax
        CHECK (tax_amount >= 0),

    CONSTRAINT chk_sale_items_subtotal
        CHECK (subtotal >= 0),

    CONSTRAINT chk_sale_items_total
        CHECK (total_amount >= 0)

);

COMMIT;