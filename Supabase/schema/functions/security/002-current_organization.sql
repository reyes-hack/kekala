BEGIN;

CREATE OR REPLACE FUNCTION public.current_organization()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id
    FROM public.profiles
    WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.current_organization IS
'Obtiene la organización del usuario autenticado.';

COMMIT;