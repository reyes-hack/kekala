BEGIN;

CREATE TABLE IF NOT EXISTS public.audit_sessions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    branch_id UUID NOT NULL,

    started_by UUID NOT NULL,

    status TEXT NOT NULL DEFAULT 'IN_PROGRESS',

    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    completed_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_audit_sessions_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id),

    CONSTRAINT fk_audit_sessions_branch
        FOREIGN KEY (branch_id)
        REFERENCES public.branches(id),

    CONSTRAINT fk_audit_sessions_started_by
        FOREIGN KEY (started_by)
        REFERENCES public.profiles(id),

    CONSTRAINT chk_audit_session_status
        CHECK (
            status IN (
                'IN_PROGRESS',
                'COMPLETED'
            )
        )

);

------------------------------------------------------------
-- Índices
------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_audit_sessions_organization
ON public.audit_sessions(organization_id);

CREATE INDEX IF NOT EXISTS idx_audit_sessions_branch
ON public.audit_sessions(branch_id);

CREATE INDEX IF NOT EXISTS idx_audit_sessions_started_by
ON public.audit_sessions(started_by);

CREATE INDEX IF NOT EXISTS idx_audit_sessions_status
ON public.audit_sessions(status);

CREATE INDEX IF NOT EXISTS idx_audit_sessions_started_at
ON public.audit_sessions(started_at);

------------------------------------------------------------
-- Trigger updated_at
------------------------------------------------------------

CREATE TRIGGER trg_audit_sessions_updated_at
BEFORE UPDATE
ON public.audit_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

------------------------------------------------------------
-- Comentarios
------------------------------------------------------------

COMMENT ON TABLE public.audit_sessions IS
'Sesiones de auditoría física de inventario realizadas por empleados.';

COMMENT ON COLUMN public.audit_sessions.id IS
'Identificador único de la sesión de auditoría.';

COMMENT ON COLUMN public.audit_sessions.organization_id IS
'Organización propietaria de la sesión de auditoría.';

COMMENT ON COLUMN public.audit_sessions.branch_id IS
'Sucursal donde se realiza la auditoría.';

COMMENT ON COLUMN public.audit_sessions.started_by IS
'Empleado que inició la sesión de auditoría.';

COMMENT ON COLUMN public.audit_sessions.status IS
'Estado actual de la sesión de auditoría.';

COMMENT ON COLUMN public.audit_sessions.started_at IS
'Fecha y hora de inicio de la auditoría.';

COMMENT ON COLUMN public.audit_sessions.completed_at IS
'Fecha y hora en que la auditoría fue finalizada.';

COMMENT ON COLUMN public.audit_sessions.created_at IS
'Fecha y hora de creación del registro.';

COMMENT ON COLUMN public.audit_sessions.updated_at IS
'Fecha y hora de la última actualización del registro.';

COMMIT;