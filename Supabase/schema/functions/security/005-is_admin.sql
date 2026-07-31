BEGIN;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role('ADMIN')
        OR public.has_role('OWNER');
$$;

COMMENT ON FUNCTION public.is_admin IS
'Indica si el usuario autenticado posee privilegios administrativos.';

COMMIT;