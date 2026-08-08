BEGIN;

CREATE OR REPLACE FUNCTION public.sync_audit_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS
$$
BEGIN

    ------------------------------------------------------------------
    -- Si existe fecha de finalización
    ------------------------------------------------------------------

    IF NEW.completed_at IS NOT NULL THEN

        NEW.status := 'COMPLETED';

    END IF;

    ------------------------------------------------------------------
    -- Si eliminaran la fecha accidentalmente
    ------------------------------------------------------------------

    IF NEW.completed_at IS NULL
       AND OLD.completed_at IS NOT NULL THEN

        NEW.status := 'IN_PROGRESS';

    END IF;

    RETURN NEW;

END;
$$;

COMMENT ON FUNCTION public.sync_audit_status IS
'Mantiene sincronizado automáticamente el estado de una sesión de auditoría con la fecha de finalización.';

COMMIT;