BEGIN;

------------------------------------------------------------------
-- Organización
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_organization
ON public.profiles (organization_id);

------------------------------------------------------------------
-- Sucursal
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_branch
ON public.profiles (branch_id);

------------------------------------------------------------------
-- Estado
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_active
ON public.profiles (is_active);

------------------------------------------------------------------
-- Nombre
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_name
ON public.profiles (
    last_name,
    first_name
);

------------------------------------------------------------------
-- Email
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_email
ON public.profiles (email);

COMMIT;