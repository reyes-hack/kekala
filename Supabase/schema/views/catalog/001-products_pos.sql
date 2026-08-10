BEGIN;

CREATE OR REPLACE VIEW public.products_pos
WITH (security_invoker = true)
AS
SELECT
    id,
    product_code,
    name,
    description,
    category_id,
    unit_id,
    is_active
FROM public.products
WHERE is_active = true;

COMMENT ON VIEW public.products_pos IS
'Vista segura para operación POS. Expone únicamente información comercial de productos y no expone cost_price ni box_price.';

COMMIT;