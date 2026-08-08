BEGIN;

CREATE OR REPLACE FUNCTION public.provision_employee(

    p_user_id UUID,
    p_organization_id UUID,
    p_branch_id UUID,
    p_full_name TEXT,
    p_pin_hash TEXT,
    p_role_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = public

AS
$$

BEGIN

    ----------------------------------------------------------------
    -- Crear perfil
    ----------------------------------------------------------------

    INSERT INTO public.profiles (

        id,
        organization_id,
        branch_id,
        full_name

    )

    VALUES (

        p_user_id,
        p_organization_id,
        p_branch_id,
        p_full_name

    );

    ----------------------------------------------------------------
    -- Crear credenciales
    ----------------------------------------------------------------

    INSERT INTO public.employee_credentials (

        profile_id,
        pin_hash

    )

    VALUES (

        p_user_id,
        p_pin_hash

    );

    ----------------------------------------------------------------
    -- Asignar rol
    ----------------------------------------------------------------

    INSERT INTO public.profile_roles (

        profile_id,
        role_id

    )

    VALUES (

        p_user_id,
        p_role_id

    );

    RETURN p_user_id;

END;
$$;

COMMENT ON FUNCTION public.provision_employee IS
'Provisiona completamente un empleado después de crear su usuario en Supabase Auth.';

REVOKE ALL
ON FUNCTION public.provision_employee(
    UUID,
    UUID,
    UUID,
    TEXT,
    TEXT,
    UUID
)
FROM PUBLIC;

COMMIT;