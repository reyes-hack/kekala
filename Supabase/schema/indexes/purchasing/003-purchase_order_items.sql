BEGIN;

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_organization
ON public.purchase_order_items (organization_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order
ON public.purchase_order_items (purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product
ON public.purchase_order_items (product_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_created_at
ON public.purchase_order_items (created_at);

COMMIT;