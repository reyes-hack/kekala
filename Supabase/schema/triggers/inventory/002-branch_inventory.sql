BEGIN;

CREATE TRIGGER trg_branch_inventory_updated_at
BEFORE UPDATE
ON public.branch_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

COMMIT;