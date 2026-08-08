BEGIN;

CREATE OR REPLACE FUNCTION public.check_branch_license_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS
$$
DECLARE

    v_branch_count INTEGER;

    v_branch_limit INTEGER := 2;

BEGIN

    SELECT COUNT(*)
    INTO v_branch_count
    FROM public.branches
    WHERE organization_id = NEW.organization_id;

    IF v_branch_count >= v_branch_limit THEN

        RAISE EXCEPTION
        'LICENSE_LIMIT_REACHED: Tu licencia actual permite un máximo de % sucursales.', v_branch_limit;

    END IF;

    RETURN NEW;

END;
$$;

COMMENT ON FUNCTION public.check_branch_license_limit IS
'Valida el límite de sucursales permitido por la licencia de la organización. Actualmente el límite es fijo (2), preparado para futuras integraciones con un módulo de licenciamiento.';

COMMIT;