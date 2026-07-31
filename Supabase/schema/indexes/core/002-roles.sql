BEGIN;

------------------------------------------------------------------
-- Código
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_roles_code
ON public.roles (code);

------------------------------------------------------------------
-- Estado
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_roles_active
ON public.roles (is_active);

------------------------------------------------------------------
-- Sistema
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_roles_system
ON public.roles (is_system);

COMMIT;