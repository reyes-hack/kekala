BEGIN;

CREATE TRIGGER trg_transfer_orders_updated_at
BEFORE UPDATE
ON public.transfer_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

COMMIT;