BEGIN;

DROP TRIGGER IF EXISTS trg_external_sales_reports_updated_at
ON public.external_sales_reports;

CREATE TRIGGER trg_external_sales_reports_updated_at
BEFORE UPDATE
ON public.external_sales_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

COMMIT;