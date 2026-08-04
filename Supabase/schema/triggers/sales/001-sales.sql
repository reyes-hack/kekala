BEGIN;

CREATE TRIGGER trg_sales_updated_at
BEFORE UPDATE
ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

COMMIT;