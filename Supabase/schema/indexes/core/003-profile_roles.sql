BEGIN;

CREATE INDEX IF NOT EXISTS idx_profile_roles_profile
ON public.profile_roles (profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_roles_role
ON public.profile_roles (role_id);

CREATE INDEX IF NOT EXISTS idx_profile_roles_active
ON public.profile_roles (is_active);

COMMIT;