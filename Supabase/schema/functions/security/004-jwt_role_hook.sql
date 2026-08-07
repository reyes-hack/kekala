BEGIN;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS
$$
DECLARE

    v_user_id UUID;

    v_profile RECORD;

    v_roles TEXT[];

    v_claims JSONB;

BEGIN

    ------------------------------------------------------------------
    -- Usuario autenticado
    ------------------------------------------------------------------

    v_user_id := (event ->> 'user_id')::uuid;

    ------------------------------------------------------------------
    -- Perfil
    ------------------------------------------------------------------

    SELECT
        p.organization_id,
        p.branch_id
    INTO v_profile
    FROM public.profiles p
    WHERE p.id = v_user_id;

    ------------------------------------------------------------------
    -- Roles
    ------------------------------------------------------------------

    SELECT
        array_agg(r.code ORDER BY r.code)
    INTO v_roles
    FROM public.profile_roles pr
    INNER JOIN public.roles r
        ON r.id = pr.role_id
    WHERE pr.profile_id = v_user_id
      AND pr.is_active = TRUE
      AND r.is_active = TRUE;

    ------------------------------------------------------------------
    -- Claims existentes
    ------------------------------------------------------------------

    v_claims := event -> 'claims';

    ------------------------------------------------------------------
    -- Organization
    ------------------------------------------------------------------

    v_claims := jsonb_set(

        v_claims,

        '{app_metadata,organization_id}',

        to_jsonb(v_profile.organization_id)

    );

    ------------------------------------------------------------------
    -- Branch
    ------------------------------------------------------------------

    v_claims := jsonb_set(

        v_claims,

        '{app_metadata,branch_id}',

        to_jsonb(v_profile.branch_id)

    );

    ------------------------------------------------------------------
    -- Roles
    ------------------------------------------------------------------

    v_claims := jsonb_set(

        v_claims,

        '{app_metadata,roles}',

        to_jsonb(COALESCE(v_roles, ARRAY[]::TEXT[]))

    );

    ------------------------------------------------------------------
    -- Actualizar JWT
    ------------------------------------------------------------------

    event := jsonb_set(

        event,

        '{claims}',

        v_claims

    );

    RETURN event;

END;
$$;

COMMENT ON FUNCTION public.custom_access_token_hook IS
'Inyecta organization_id, branch_id y roles en el JWT utilizando la estructura de perfiles y roles del ERP.';

COMMIT;