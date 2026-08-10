BEGIN;

CREATE OR REPLACE FUNCTION public.is_same_org_and_branch(
    p_organization_id UUID,
    p_branch_id UUID
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
        OR (
            p_organization_id = public.jwt_organization_id()
            AND
            p_branch_id = public.jwt_branch_id()
        );
$$;

COMMENT ON FUNCTION public.is_same_org_and_branch IS
'Valida que el registro pertenezca simultáneamente a la organización y sucursal del usuario autenticado. Los administradores globales tienen acceso completo.';

REVOKE ALL
ON FUNCTION public.is_same_org_and_branch(UUID, UUID)
FROM PUBLIC;

COMMIT;