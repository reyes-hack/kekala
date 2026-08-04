BEGIN;

CREATE INDEX IF NOT EXISTS idx_waste_items_organization
ON public.waste_items (organization_id);

CREATE INDEX IF NOT EXISTS idx_waste_items_record
ON public.waste_items (waste_record_id);

CREATE INDEX IF NOT EXISTS idx_waste_items_product
ON public.waste_items (product_id);

CREATE INDEX IF NOT EXISTS idx_waste_items_created_at
ON public.waste_items (created_at);

COMMIT;