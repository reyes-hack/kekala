BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_audit_session

ON public.audit_sessions(branch_id)

WHERE status='IN_PROGRESS';

COMMIT;


BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_audit_session
ON public.audit_sessions(branch_id)
WHERE status = 'IN_PROGRESS';

COMMENT ON INDEX public.uq_active_audit_session IS
'Permite únicamente una sesión de auditoría en progreso por sucursal.';

COMMIT;