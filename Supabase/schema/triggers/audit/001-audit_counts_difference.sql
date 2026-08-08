BEGIN;

DROP TRIGGER IF EXISTS trg_audit_counts_difference
ON public.audit_counts;

CREATE TRIGGER trg_audit_counts_difference
BEFORE INSERT
ON public.audit_counts
FOR EACH ROW
EXECUTE FUNCTION public.calculate_audit_difference();

COMMIT;