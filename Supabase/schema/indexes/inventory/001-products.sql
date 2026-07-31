BEGIN;

------------------------------------------------------------------
-- Product Code
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_product_code
ON public.products (product_code);

------------------------------------------------------------------
-- Category
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_category
ON public.products (category_id);

------------------------------------------------------------------
-- Unit
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_unit
ON public.products (unit_id);

------------------------------------------------------------------
-- Active Products
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_active
ON public.products (is_active);

------------------------------------------------------------------
-- Dashboard
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_category_active
ON public.products (
    category_id,
    is_active
);

COMMIT;