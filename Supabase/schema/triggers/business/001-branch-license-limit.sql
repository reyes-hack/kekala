BEGIN;

DROP TRIGGER IF EXISTS trg_branch_license_limit
ON public.branches;

CREATE TRIGGER trg_branch_license_limit
BEFORE INSERT
ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.check_branch_license_limit();

COMMIT;