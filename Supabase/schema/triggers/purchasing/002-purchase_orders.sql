BEGIN;

CREATE TRIGGER trg_purchase_orders_updated_at
BEFORE UPDATE
ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

COMMIT;