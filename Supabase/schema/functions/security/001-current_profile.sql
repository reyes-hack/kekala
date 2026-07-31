BEGIN;

CREATE OR REPLACE FUNCTION public.current_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
    FROM public.profiles
    WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.current_profile IS
'Obtiene el perfil del usuario autenticado.';

COMMIT;