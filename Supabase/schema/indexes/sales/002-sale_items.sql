BEGIN;

CREATE INDEX IF NOT EXISTS idx_sale_items_organization
ON public.sale_items (organization_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale
ON public.sale_items (sale_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_product
ON public.sale_items (product_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_created_at
ON public.sale_items (created_at);

COMMIT;