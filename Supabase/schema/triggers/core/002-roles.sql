BEGIN;

CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE
ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

COMMIT;