BEGIN;

CREATE INDEX IF NOT EXISTS idx_sales_organization
ON public.sales (organization_id);

CREATE INDEX IF NOT EXISTS idx_sales_branch
ON public.sales (branch_id);

CREATE INDEX IF NOT EXISTS idx_sales_created_by
ON public.sales (created_by);

CREATE INDEX IF NOT EXISTS idx_sales_status
ON public.sales (status_id);

CREATE INDEX IF NOT EXISTS idx_sales_created_at
ON public.sales (created_at);

CREATE INDEX IF NOT EXISTS idx_sales_branch_created
ON public.sales (
    branch_id,
    created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_sales_org_created
ON public.sales (
    organization_id,
    created_at DESC
);

COMMIT;