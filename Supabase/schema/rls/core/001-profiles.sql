BEGIN;

------------------------------------------------------------------
-- Habilitar RLS
------------------------------------------------------------------

ALTER TABLE public.profiles
ENABLE ROW LEVEL SECURITY;

------------------------------------------------------------------
-- SELECT
------------------------------------------------------------------

CREATE POLICY profiles_select_policy
ON public.profiles
FOR SELECT
USING (

    public.is_admin()

    OR

    id = auth.uid()

);

------------------------------------------------------------------
-- UPDATE
------------------------------------------------------------------

CREATE POLICY profiles_update_policy
ON public.profiles
FOR UPDATE
USING (

    id = auth.uid()

)
WITH CHECK (

    id = auth.uid()

);

COMMIT;