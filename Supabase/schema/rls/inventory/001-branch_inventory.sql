BEGIN;

------------------------------------------------------------------
-- Habilitar RLS
------------------------------------------------------------------

ALTER TABLE public.branch_inventory
ENABLE ROW LEVEL SECURITY;

------------------------------------------------------------------
-- SELECT
------------------------------------------------------------------

CREATE POLICY branch_inventory_select_policy
ON public.branch_inventory
FOR SELECT
USING (

    public.is_admin()

    OR

    (
        organization_id = public.current_organization()

        AND

        branch_id = public.current_branch()
    )

);

COMMIT;