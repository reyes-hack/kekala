BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.verify_employee_pin(

    p_profile_id UUID,

    p_pin TEXT

)

RETURNS BOOLEAN

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = public

AS
$$

DECLARE

    v_hash TEXT;

BEGIN

    SELECT pin_hash
    INTO v_hash
    FROM public.employee_credentials
    WHERE profile_id = p_profile_id
      AND is_active = TRUE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF crypt(p_pin, v_hash) <> v_hash THEN
        RETURN FALSE;
    END IF;

    UPDATE public.employee_credentials
    SET last_login_at = now()
    WHERE profile_id = p_profile_id;

    RETURN TRUE;

END;
$$;

COMMENT ON FUNCTION public.verify_employee_pin IS
'Verifica el PIN hasheado de un empleado y actualiza la fecha del último acceso exitoso.';

REVOKE ALL ON FUNCTION public.verify_employee_pin(UUID, TEXT) FROM PUBLIC;

COMMIT;