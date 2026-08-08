BEGIN;

CREATE TABLE IF NOT EXISTS public.notifications (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    branch_id UUID NULL,

    title TEXT NOT NULL,

    message TEXT NOT NULL,

    type TEXT NOT NULL,

    reference_type TEXT NULL,

    reference_id UUID NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_notifications_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_branch
        FOREIGN KEY (branch_id)
        REFERENCES public.branches(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_notifications_type
        CHECK (
            type IN (
                'INFO',
                'SUCCESS',
                'WARNING',
                'ALERT'
            )
        ),

    CONSTRAINT chk_notifications_metadata
        CHECK (
            jsonb_typeof(metadata) = 'object'
        )

);

------------------------------------------------------------
-- Índices
------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_notifications_organization
ON public.notifications(organization_id);

CREATE INDEX IF NOT EXISTS idx_notifications_branch
ON public.notifications(branch_id);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type
ON public.notifications(type);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read
ON public.notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_reference
ON public.notifications(reference_type, reference_id);

------------------------------------------------------------
-- Comentarios
------------------------------------------------------------

COMMENT ON TABLE public.notifications IS
'Centro de notificaciones del ERP para alertas, advertencias e información operacional.';

COMMENT ON COLUMN public.notifications.id IS
'Identificador único de la notificación.';

COMMENT ON COLUMN public.notifications.organization_id IS
'Organización propietaria de la notificación.';

COMMENT ON COLUMN public.notifications.branch_id IS
'Sucursal relacionada con la notificación. Puede ser NULL para notificaciones globales.';

COMMENT ON COLUMN public.notifications.title IS
'Título corto mostrado al usuario.';

COMMENT ON COLUMN public.notifications.message IS
'Descripción detallada de la notificación.';

COMMENT ON COLUMN public.notifications.type IS
'Clasificación de la notificación: INFO, SUCCESS, WARNING o ALERT.';

COMMENT ON COLUMN public.notifications.reference_type IS
'Tipo de entidad relacionada con la notificación.';

COMMENT ON COLUMN public.notifications.reference_id IS
'Identificador del registro relacionado.';

COMMENT ON COLUMN public.notifications.is_read IS
'Indica si la notificación ya fue leída por el usuario.';

COMMENT ON COLUMN public.notifications.metadata IS
'Información adicional de la notificación en formato JSON.';

COMMENT ON COLUMN public.notifications.created_at IS
'Fecha y hora de creación de la notificación.';

COMMIT;