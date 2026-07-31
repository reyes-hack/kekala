BEGIN;

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE
ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

COMMIT;