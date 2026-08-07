BEGIN;

------------------------------------------------------------------
-- SALES
------------------------------------------------------------------

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sales_select_policy
ON public.sales;

CREATE POLICY sales_select_policy
ON public.sales
FOR SELECT
USING (

    is_jwt_admin()

    OR

    (
        organization_id = jwt_organization_id()
        AND
        branch_id = jwt_branch_id()
    )

);

------------------------------------------------------------------
-- PURCHASE ORDERS
------------------------------------------------------------------

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS purchase_orders_select_policy
ON public.purchase_orders;

CREATE POLICY purchase_orders_select_policy
ON public.purchase_orders
FOR SELECT
USING (

    is_jwt_admin()

    OR

    branch_id = jwt_branch_id()

);

------------------------------------------------------------------
-- EXPENSES
------------------------------------------------------------------

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS expenses_select_policy
ON public.expenses;

CREATE POLICY expenses_select_policy
ON public.expenses
FOR SELECT
USING (

    is_jwt_admin()

    OR

    branch_id = jwt_branch_id()

);

------------------------------------------------------------------
-- WASTE RECORDS
------------------------------------------------------------------

ALTER TABLE public.waste_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS waste_records_select_policy
ON public.waste_records;

CREATE POLICY waste_records_select_policy
ON public.waste_records
FOR SELECT
USING (

    is_jwt_admin()

    OR

    (
        organization_id = jwt_organization_id()
        AND
        branch_id = jwt_branch_id()
    )

);

------------------------------------------------------------------
-- TRANSFER ORDERS
------------------------------------------------------------------

ALTER TABLE public.transfer_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transfer_orders_select_policy
ON public.transfer_orders;

CREATE POLICY transfer_orders_select_policy
ON public.transfer_orders
FOR SELECT
USING (

    is_jwt_admin()

    OR

    (
        organization_id = jwt_organization_id()

        AND

        (

            source_branch_id = jwt_branch_id()

            OR

            destination_branch_id = jwt_branch_id()

        )

    )

);

------------------------------------------------------------------
-- INVENTORY MOVEMENTS
------------------------------------------------------------------

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_movements_select_policy
ON public.inventory_movements;

CREATE POLICY inventory_movements_select_policy
ON public.inventory_movements
FOR SELECT
USING (

    is_jwt_admin()

    OR

    (
        organization_id = jwt_organization_id()

        AND

        branch_id = jwt_branch_id()

    )

);

COMMIT;