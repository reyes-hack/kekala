BEGIN;

------------------------------------------------------------------
-- Tabla
------------------------------------------------------------------

COMMENT ON TABLE public.profiles IS
'Perfil público de los usuarios autenticados mediante Supabase Auth. Contiene la información organizacional y de negocio utilizada por el ERP.';

------------------------------------------------------------------
-- Columnas
------------------------------------------------------------------

COMMENT ON COLUMN public.profiles.id IS
'Identificador del usuario. Corresponde directamente al id de auth.users.';

COMMENT ON COLUMN public.profiles.organization_id IS
'Organización a la que pertenece el usuario.';

COMMENT ON COLUMN public.profiles.first_name IS
'Nombre del usuario.';

COMMENT ON COLUMN public.profiles.last_name IS
'Apellidos del usuario.';

COMMENT ON COLUMN public.profiles.display_name IS
'Nombre visible utilizado en la interfaz del sistema.';

COMMENT ON COLUMN public.profiles.email IS
'Correo electrónico del usuario para fines administrativos y de consulta.';

COMMENT ON COLUMN public.profiles.phone IS
'Número telefónico del usuario.';

COMMENT ON COLUMN public.profiles.avatar_url IS
'URL de la imagen de perfil del usuario.';

COMMENT ON COLUMN public.profiles.branch_id IS
'Sucursal principal asignada al usuario.';

COMMENT ON COLUMN public.profiles.is_active IS
'Indica si el usuario puede operar dentro del ERP.';

COMMENT ON COLUMN public.profiles.metadata IS
'Configuraciones adicionales del usuario almacenadas en formato JSON.';

COMMENT ON COLUMN public.profiles.created_at IS
'Fecha y hora de creación del perfil.';

COMMENT ON COLUMN public.profiles.updated_at IS
'Fecha y hora de la última actualización del perfil.';

COMMIT;