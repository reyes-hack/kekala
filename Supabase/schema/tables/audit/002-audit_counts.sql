BEGIN;

CREATE TABLE IF NOT EXISTS public.audit_counts (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID NOT NULL,

    organization_id UUID NOT NULL,

    product_id UUID NOT NULL,

    expected_stock NUMERIC(12,2),

    counted_stock NUMERIC(12,2) NOT NULL,

    difference NUMERIC(12,2),

    evidence_photo_url TEXT,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_audit_counts_session
        FOREIGN KEY (session_id)
        REFERENCES public.audit_sessions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_audit_counts_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id),

    CONSTRAINT fk_audit_counts_product
        FOREIGN KEY (product_id)
        REFERENCES public.products(id),

    CONSTRAINT chk_audit_count_positive
        CHECK (
            counted_stock >= 0
        )

);

------------------------------------------------------------
-- Índices
------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_audit_counts_session
ON public.audit_counts(session_id);

CREATE INDEX IF NOT EXISTS idx_audit_counts_product
ON public.audit_counts(product_id);

CREATE INDEX IF NOT EXISTS idx_audit_counts_organization
ON public.audit_counts(organization_id);

CREATE INDEX IF NOT EXISTS idx_audit_counts_created_at
ON public.audit_counts(created_at);

------------------------------------------------------------
-- Evitar duplicar producto en una sesión
------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS uq_audit_session_product

ON public.audit_counts(

    session_id,

    product_id

);

------------------------------------------------------------
-- Comentarios
------------------------------------------------------------

COMMENT ON TABLE public.audit_counts IS
'Conteos físicos registrados durante una sesión de auditoría de inventario.';

COMMENT ON COLUMN public.audit_counts.id IS
'Identificador único del conteo.';

COMMENT ON COLUMN public.audit_counts.session_id IS
'Sesión de auditoría a la que pertenece el conteo.';

COMMENT ON COLUMN public.audit_counts.organization_id IS
'Organización propietaria del registro.';

COMMENT ON COLUMN public.audit_counts.product_id IS
'Producto contado físicamente.';

COMMENT ON COLUMN public.audit_counts.expected_stock IS
'Existencia teórica calculada automáticamente mediante un trigger.';

COMMENT ON COLUMN public.audit_counts.counted_stock IS
'Cantidad física capturada por el empleado.';

COMMENT ON COLUMN public.audit_counts.difference IS
'Diferencia entre el inventario físico y el inventario teórico.';

COMMENT ON COLUMN public.audit_counts.evidence_photo_url IS
'Ruta del comprobante fotográfico almacenado en Supabase Storage.';

COMMENT ON COLUMN public.audit_counts.notes IS
'Observaciones adicionales registradas durante el conteo.';

COMMENT ON COLUMN public.audit_counts.created_at IS
'Fecha y hora de creación del registro.';

COMMIT;