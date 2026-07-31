BEGIN;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at IS
'Actualiza automáticamente la columna updated_at antes de cada UPDATE. Función reutilizable por todas las tablas del ERP.';

COMMIT;