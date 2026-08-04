BEGIN;

CREATE INDEX IF NOT EXISTS idx_expenses_organization
ON public.expenses (organization_id);

CREATE INDEX IF NOT EXISTS idx_expenses_branch
ON public.expenses (branch_id);

CREATE INDEX IF NOT EXISTS idx_expenses_category
ON public.expenses (category_id);

CREATE INDEX IF NOT EXISTS idx_expenses_establishment
ON public.expenses (establishment_id);

CREATE INDEX IF NOT EXISTS idx_expenses_payment_method
ON public.expenses (payment_method_id);

CREATE INDEX IF NOT EXISTS idx_expenses_supplier
ON public.expenses (supplier_id);

CREATE INDEX IF NOT EXISTS idx_expenses_created_by
ON public.expenses (created_by);

CREATE INDEX IF NOT EXISTS idx_expenses_date
ON public.expenses (expense_date);

CREATE INDEX IF NOT EXISTS idx_expenses_branch_date
ON public.expenses (
    branch_id,
    expense_date DESC
);

COMMIT;