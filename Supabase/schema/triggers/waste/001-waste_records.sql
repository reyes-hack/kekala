BEGIN;

CREATE TRIGGER trg_waste_records_updated_at
BEFORE UPDATE
ON public.waste_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

COMMIT;