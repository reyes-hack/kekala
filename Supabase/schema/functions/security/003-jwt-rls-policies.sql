BEGIN;

------------------------------------------------------------------
-- PROFILES
------------------------------------------------------------------

DROP POLICY IF EXISTS profiles_select_policy
ON public.profiles;

CREATE POLICY profiles_select_policy
ON public.profiles
FOR SELECT
USING (

    id = auth.uid()

    OR

    is_jwt_admin()

);

DROP POLICY IF EXISTS profiles_update_policy
ON public.profiles;

CREATE POLICY profiles_update_policy
ON public.profiles
FOR UPDATE
USING (

    id = auth.uid()

    OR

    is_jwt_admin()

)
WITH CHECK (

    id = auth.uid()

    OR

    is_jwt_admin()

);

------------------------------------------------------------------
-- BRANCH INVENTORY
------------------------------------------------------------------

DROP POLICY IF EXISTS branch_inventory_select_policy
ON public.branch_inventory;

CREATE POLICY branch_inventory_select_policy
ON public.branch_inventory
FOR SELECT
USING (

    is_jwt_admin()

    OR

    branch_id = jwt_branch_id()

);

COMMIT;