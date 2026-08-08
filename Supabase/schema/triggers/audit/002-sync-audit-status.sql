BEGIN;

DROP TRIGGER IF EXISTS trg_sync_audit_status
ON public.audit_sessions;

CREATE TRIGGER trg_sync_audit_status
BEFORE UPDATE
ON public.audit_sessions
FOR EACH ROW
EXECUTE FUNCTION public.sync_audit_status();

COMMIT;