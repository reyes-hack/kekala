BEGIN;

CREATE INDEX IF NOT EXISTS idx_payments_organization
ON public.payments (organization_id);

CREATE INDEX IF NOT EXISTS idx_payments_branch
ON public.payments (branch_id);

CREATE INDEX IF NOT EXISTS idx_payments_sale
ON public.payments (sale_id);

CREATE INDEX IF NOT EXISTS idx_payments_method
ON public.payments (payment_method_id);

CREATE INDEX IF NOT EXISTS idx_payments_created_at
ON public.payments (created_at);

COMMIT;