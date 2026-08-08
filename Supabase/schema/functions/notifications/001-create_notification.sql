BEGIN;

CREATE OR REPLACE FUNCTION public.create_notification(

    p_organization_id UUID,

    p_branch_id UUID,

    p_title TEXT,

    p_message TEXT,

    p_type TEXT,

    p_reference_type TEXT DEFAULT NULL,

    p_reference_id UUID DEFAULT NULL,

    p_metadata JSONB DEFAULT '{}'::jsonb

)

RETURNS UUID

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = public

AS
$$

DECLARE

    v_notification_id UUID;

BEGIN

    INSERT INTO public.notifications (

        organization_id,

        branch_id,

        title,

        message,

        type,

        reference_type,

        reference_id,

        metadata

    )

    VALUES (

        p_organization_id,

        p_branch_id,

        p_title,

        p_message,

        p_type,

        p_reference_type,

        p_reference_id,

        COALESCE(p_metadata,'{}'::jsonb)

    )

    RETURNING id

    INTO v_notification_id;

    RETURN v_notification_id;

END;
$$;

COMMENT ON FUNCTION public.create_notification IS
'Servicio centralizado para generar notificaciones dentro del ERP.';

COMMIT;