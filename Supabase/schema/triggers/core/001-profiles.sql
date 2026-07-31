BEGIN;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

COMMIT;