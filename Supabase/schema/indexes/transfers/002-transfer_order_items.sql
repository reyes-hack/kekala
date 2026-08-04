BEGIN;

CREATE INDEX IF NOT EXISTS idx_transfer_items_organization
ON public.transfer_order_items (organization_id);

CREATE INDEX IF NOT EXISTS idx_transfer_items_order
ON public.transfer_order_items (transfer_order_id);

CREATE INDEX IF NOT EXISTS idx_transfer_items_product
ON public.transfer_order_items (product_id);

CREATE INDEX IF NOT EXISTS idx_transfer_items_created_at
ON public.transfer_order_items (created_at);

COMMIT;