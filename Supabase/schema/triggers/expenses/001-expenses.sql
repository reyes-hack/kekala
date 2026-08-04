BEGIN;

CREATE TRIGGER trg_expenses_updated_at
BEFORE UPDATE
ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

COMMIT;