BEGIN;

-- Quitar explícitamente EXECUTE de todos los usuarios públicos.
REVOKE EXECUTE
ON FUNCTION public.get_pos_products()
FROM PUBLIC;

-- Quitar también cualquier permiso explícito del rol anon.
REVOKE EXECUTE
ON FUNCTION public.get_pos_products()
FROM anon;

-- El catálogo POS solamente puede consultarse por usuarios autenticados.
GRANT EXECUTE
ON FUNCTION public.get_pos_products()
TO authenticated;

COMMIT;