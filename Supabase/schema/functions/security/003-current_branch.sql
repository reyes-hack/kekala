BEGIN;

CREATE OR REPLACE FUNCTION public.current_branch()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT branch_id
    FROM public.profiles
    WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.current_branch IS
'Obtiene la sucursal asignada al usuario autenticado.';

COMMIT;