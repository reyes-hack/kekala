BEGIN;

CREATE TABLE IF NOT EXISTS public.products (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Identificación
    ------------------------------------------------------------------

    product_code TEXT NOT NULL,

    name TEXT NOT NULL,

    description TEXT,

    ------------------------------------------------------------------
    -- Catálogos
    ------------------------------------------------------------------

    category_id UUID NOT NULL,

    unit_id UUID NOT NULL,

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

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES public.catalog_values(id),

    CONSTRAINT fk_products_unit
        FOREIGN KEY (unit_id)
        REFERENCES public.catalog_values(id),

    ------------------------------------------------------------------
    -- Unique Constraints
    ------------------------------------------------------------------

    CONSTRAINT uq_products_product_code
        UNIQUE (product_code),

    ------------------------------------------------------------------
    -- Check Constraints
    ------------------------------------------------------------------

    CONSTRAINT chk_products_product_code
        CHECK (
            product_code = UPPER(product_code)
        ),

    CONSTRAINT chk_products_name
        CHECK (
            LENGTH(TRIM(name)) > 0
        )

);

COMMIT;