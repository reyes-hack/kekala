BEGIN;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_organization
ON public.purchase_orders (organization_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch
ON public.purchase_orders (branch_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier
ON public.purchase_orders (supplier_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by
ON public.purchase_orders (created_by);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status
ON public.purchase_orders (status_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at
ON public.purchase_orders (created_at);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch_created
ON public.purchase_orders (
    branch_id,
    created_at DESC
);

COMMIT;