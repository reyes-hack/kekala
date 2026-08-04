BEGIN;

CREATE INDEX IF NOT EXISTS idx_expense_attachments_organization
ON public.expense_attachments (organization_id);

CREATE INDEX IF NOT EXISTS idx_expense_attachments_expense
ON public.expense_attachments (expense_id);

CREATE INDEX IF NOT EXISTS idx_expense_attachments_uploaded_by
ON public.expense_attachments (uploaded_by);

CREATE INDEX IF NOT EXISTS idx_expense_attachments_created_at
ON public.expense_attachments (created_at);

COMMIT;