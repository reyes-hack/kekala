BEGIN;

------------------------------------------------------------------
-- Organización del JWT
------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.jwt_organization_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS
$$
SELECT
(
    auth.jwt()
    -> 'app_metadata'
    ->> 'organization_id'
)::uuid;
$$;

COMMENT ON FUNCTION public.jwt_organization_id IS
'Obtiene organization_id desde el JWT.';

------------------------------------------------------------------
-- Sucursal del JWT
------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.jwt_branch_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS
$$
SELECT
(
    auth.jwt()
    -> 'app_metadata'
    ->> 'branch_id'
)::uuid;
$$;

COMMENT ON FUNCTION public.jwt_branch_id IS
'Obtiene branch_id desde el JWT.';

------------------------------------------------------------------
-- Validar rol
------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_jwt_role(
    p_role TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS
$$
SELECT EXISTS (

    SELECT 1

    FROM jsonb_array_elements_text(

        auth.jwt()
        -> 'app_metadata'
        -> 'roles'

    ) r(role)

    WHERE upper(r.role)=upper(p_role)

);
$$;

COMMENT ON FUNCTION public.has_jwt_role IS
'Indica si el JWT contiene el rol solicitado.';

------------------------------------------------------------------
-- Helper Admin
------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_jwt_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS
$$
SELECT public.has_jwt_role('ADMIN');
$$;

COMMENT ON FUNCTION public.is_jwt_admin IS
'Indica si el usuario autenticado posee el rol ADMIN dentro del JWT.';

COMMIT;