BEGIN;

------------------------------------------------------------------
-- Tabla
------------------------------------------------------------------

COMMENT ON TABLE public.roles IS
'Catálogo de roles del ERP. Define los perfiles funcionales que pueden asignarse a los usuarios del sistema.';

------------------------------------------------------------------
-- Columnas
------------------------------------------------------------------

COMMENT ON COLUMN public.roles.id IS
'Identificador único del rol.';

COMMENT ON COLUMN public.roles.code IS
'Código interno e inmutable del rol.';

COMMENT ON COLUMN public.roles.name IS
'Nombre visible del rol.';

COMMENT ON COLUMN public.roles.description IS
'Descripción funcional del rol.';

COMMENT ON COLUMN public.roles.is_system IS
'Indica si el rol forma parte del sistema y no debe eliminarse desde la aplicación.';

COMMENT ON COLUMN public.roles.is_active IS
'Indica si el rol puede asignarse a nuevos usuarios.';

COMMENT ON COLUMN public.roles.metadata IS
'Configuración adicional del rol almacenada en formato JSON.';

COMMENT ON COLUMN public.roles.created_at IS
'Fecha y hora de creación del rol.';

COMMENT ON COLUMN public.roles.updated_at IS
'Fecha y hora de la última actualización del rol.';

COMMIT;