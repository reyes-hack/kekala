BEGIN;

CREATE OR REPLACE FUNCTION public.is_same_branch(

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
    OR
    p_branch_id = public.jwt_branch_id();

$$;

COMMENT ON FUNCTION public.is_same_branch IS
'Determina si el usuario autenticado pertenece a la sucursal indicada o posee privilegios de administrador.';

REVOKE ALL
ON FUNCTION public.is_same_branch(UUID)
FROM PUBLIC;

COMMIT;