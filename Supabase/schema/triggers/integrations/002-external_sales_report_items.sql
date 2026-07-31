BEGIN;

CREATE TRIGGER trg_external_sales_report_items_updated_at
BEFORE UPDATE
ON public.external_sales_report_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

COMMIT;