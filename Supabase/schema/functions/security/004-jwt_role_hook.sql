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
    v_app_metadata JSONB;
BEGIN
    v_user_id := (event ->> 'user_id')::uuid;

    -- Extraer claims y app_metadata asegurando que existan
    v_claims := COALESCE(event -> 'claims', '{}'::jsonb);
    v_app_metadata := COALESCE(v_claims -> 'app_metadata', '{}'::jsonb);

    -- 1. Obtener Perfil
    SELECT p.organization_id, p.branch_id
    INTO v_profile
    FROM public.profiles p
    WHERE p.id = v_user_id;

    -- 2. Obtener Roles
    SELECT array_agg(r.code ORDER BY r.code)
    INTO v_roles
    FROM public.profile_roles pr
    INNER JOIN public.roles r ON r.id = pr.role_id
    WHERE pr.profile_id = v_user_id
      AND pr.is_active = TRUE
      AND r.is_active = TRUE;

    -- 3. Auditoría de Seguridad: Abortar si no tiene rol
    IF v_roles IS NULL OR array_length(v_roles, 1) IS NULL THEN
        -- Intentar registrar silenciosamente (manejando posible falta de permisos)
        BEGIN
            INSERT INTO public.auth_audit_logs (user_id, email, event_type, details)
            VALUES (
                v_user_id, 
                event->'claims'->>'email', 
                'ROLE_MISSING', 
                jsonb_build_object('reason', 'User has no active roles assigned')
            );

            IF v_profile IS NOT NULL AND v_profile.organization_id IS NOT NULL THEN
                INSERT INTO public.security_alerts (organization_id, title, description, severity)
                VALUES (
                    v_profile.organization_id, 
                    'Intento de Acceso No Autorizado', 
                    'El usuario ' || COALESCE(event->'claims'->>'email', 'desconocido') || ' intentó iniciar sesión sin rol.', 
                    'HIGH'
                );
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Si falla el insert por permisos u otra cosa, ignorar para poder devolver el error HTTP 403 correctamente
        END;

        -- Devolver un error 403 limpio a Supabase Auth en lugar de hacer crash con 500
        RETURN jsonb_build_object(
            'error', jsonb_build_object(
                'http_code', 403,
                'message', 'Acceso denegado: Usuario sin rol asignado en el sistema.'
            )
        );
    END IF;

    -- 4. Inyectar variables en app_metadata
    IF v_profile IS NOT NULL AND v_profile.organization_id IS NOT NULL THEN
        v_app_metadata := jsonb_set(v_app_metadata, '{organization_id}', to_jsonb(v_profile.organization_id));
    END IF;

    IF v_profile IS NOT NULL AND v_profile.branch_id IS NOT NULL THEN
        v_app_metadata := jsonb_set(v_app_metadata, '{branch_id}', to_jsonb(v_profile.branch_id));
    END IF;

    v_app_metadata := jsonb_set(v_app_metadata, '{roles}', to_jsonb(v_roles));

    -- Reconstruir claims
    v_claims := jsonb_set(v_claims, '{app_metadata}', v_app_metadata);
    event := jsonb_set(event, '{claims}', v_claims);

    RETURN event;
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

COMMIT;