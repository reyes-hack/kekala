BEGIN;

COMMENT ON TABLE public.profile_roles IS
'Tabla de relación entre perfiles y roles. Permite asignar uno o varios roles a cada usuario del ERP.';

COMMENT ON COLUMN public.profile_roles.id IS
'Identificador único de la asignación de rol.';

COMMENT ON COLUMN public.profile_roles.profile_id IS
'Perfil al que pertenece la asignación.';

COMMENT ON COLUMN public.profile_roles.role_id IS
'Rol asignado al perfil.';

COMMENT ON COLUMN public.profile_roles.is_active IS
'Indica si la asignación del rol permanece activa.';

COMMENT ON COLUMN public.profile_roles.created_at IS
'Fecha y hora de creación de la asignación.';

COMMENT ON COLUMN public.profile_roles.updated_at IS
'Fecha y hora de la última actualización de la asignación.';

COMMIT;