BEGIN;

CREATE OR REPLACE FUNCTION public.is_same_organization(
    p_organization_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS
$$
    SELECT
        public.is_jwt_admin()
        OR
        p_organization_id = public.jwt_organization_id();
$$;

COMMENT ON FUNCTION public.is_same_organization IS
'Determina si el usuario autenticado pertenece a la organización indicada o posee privilegios de administrador.';

REVOKE ALL
ON FUNCTION public.is_same_organization(UUID)
FROM PUBLIC;

COMMIT;