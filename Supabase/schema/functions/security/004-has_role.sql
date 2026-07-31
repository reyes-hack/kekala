BEGIN;

CREATE OR REPLACE FUNCTION public.has_role(
    p_role_code TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (

        SELECT 1

        FROM public.profile_roles pr

        INNER JOIN public.roles r
            ON r.id = pr.role_id

        WHERE pr.profile_id = auth.uid()
          AND pr.is_active = TRUE
          AND r.is_active = TRUE
          AND r.code = UPPER(p_role_code)

    );
$$;

COMMENT ON FUNCTION public.has_role IS
'Indica si el usuario autenticado posee un rol específico.';

COMMIT;