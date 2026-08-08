BEGIN;

CREATE OR REPLACE FUNCTION public.sync_audit_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS
$$
BEGIN

    IF NEW.completed_at IS NOT NULL THEN
        NEW.status := 'COMPLETED';
    END IF;

    RETURN NEW;

END;
$$;

COMMENT ON FUNCTION public.sync_audit_status IS
'Sincroniza automáticamente el estado de la auditoría cuando existe una fecha de finalización.';

COMMIT;


CREATE INDEX IF NOT EXISTS idx_audit_counts_evidence
ON public.audit_counts(evidence_photo_url);