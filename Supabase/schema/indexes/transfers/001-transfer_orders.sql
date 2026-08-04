BEGIN;

CREATE INDEX IF NOT EXISTS idx_transfer_orders_organization
ON public.transfer_orders (organization_id);

CREATE INDEX IF NOT EXISTS idx_transfer_orders_source
ON public.transfer_orders (source_branch_id);

CREATE INDEX IF NOT EXISTS idx_transfer_orders_destination
ON public.transfer_orders (destination_branch_id);

CREATE INDEX IF NOT EXISTS idx_transfer_orders_status
ON public.transfer_orders (status_id);

CREATE INDEX IF NOT EXISTS idx_transfer_orders_requested_by
ON public.transfer_orders (requested_by);

CREATE INDEX IF NOT EXISTS idx_transfer_orders_transfer_date
ON public.transfer_orders (transfer_date);

COMMIT;