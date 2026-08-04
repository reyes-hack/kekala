BEGIN;

CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE
ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

COMMIT;