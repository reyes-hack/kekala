BEGIN;

CREATE INDEX IF NOT EXISTS idx_waste_records_organization
ON public.waste_records (organization_id);

CREATE INDEX IF NOT EXISTS idx_waste_records_branch
ON public.waste_records (branch_id);

CREATE INDEX IF NOT EXISTS idx_waste_records_reported_by
ON public.waste_records (reported_by);

CREATE INDEX IF NOT EXISTS idx_waste_records_status
ON public.waste_records (status_id);

CREATE INDEX IF NOT EXISTS idx_waste_records_reason
ON public.waste_records (reason_id);

CREATE INDEX IF NOT EXISTS idx_waste_records_date
ON public.waste_records (waste_date);

CREATE INDEX IF NOT EXISTS idx_waste_records_branch_date
ON public.waste_records (
    branch_id,
    waste_date DESC
);

COMMIT;