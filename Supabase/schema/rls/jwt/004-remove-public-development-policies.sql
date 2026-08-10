BEGIN;

----------------------------------------------------------------------
-- El frontend ya cuenta con autenticación JWT.
-- Se eliminan las políticas públicas temporales utilizadas durante
-- la etapa previa a Supabase Auth.
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "Permitir lectura publica de sucursales"
ON public.branches;

DROP POLICY IF EXISTS
    "Permitir lectura publica de tipos de catalogo"
ON public.catalog_types;

DROP POLICY IF EXISTS
    "Permitir lectura publica de valores de catalogo"
ON public.catalog_values;

DROP POLICY IF EXISTS
    "Permitir lectura publica de productos"
ON public.products;

DROP POLICY IF EXISTS
    "Permitir TODO en foodbot_mappings"
ON public.foodbot_mappings;

COMMIT;