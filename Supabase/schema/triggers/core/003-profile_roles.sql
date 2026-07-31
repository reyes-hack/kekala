BEGIN;

CREATE TRIGGER trg_profile_roles_updated_at
BEFORE UPDATE
ON public.profile_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

COMMIT;