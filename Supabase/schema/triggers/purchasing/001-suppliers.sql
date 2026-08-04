BEGIN;

CREATE TRIGGER trg_suppliers_updated_at
BEFORE UPDATE
ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

COMMIT;