BEGIN;

----------------------------------------------------------------------
-- EXPENSES
--
-- Esta tabla pertenece al refactor temporal de Compras/Gastos y
-- actualmente NO tiene organization_id.
--
-- El aislamiento se realiza mediante branch_id.
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "expenses_cashier_select"
ON public.expenses;

DROP POLICY IF EXISTS
    "expenses_cashier_insert"
ON public.expenses;

CREATE POLICY "expenses_cashier_select"
ON public.expenses
FOR SELECT
TO authenticated
USING (
    public.has_jwt_role('CASHIER')
    AND public.is_same_branch(branch_id)
);

CREATE POLICY "expenses_cashier_insert"
ON public.expenses
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_jwt_role('CASHIER')
    AND public.is_same_branch(branch_id)
);


----------------------------------------------------------------------
-- SALES
--
-- organization_id + branch_id
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "sales_cashier_select"
ON public.sales;

DROP POLICY IF EXISTS
    "sales_cashier_insert"
ON public.sales;

CREATE POLICY "sales_cashier_select"
ON public.sales
FOR SELECT
TO authenticated
USING (
    public.has_jwt_role('CASHIER')
    AND public.is_same_org_and_branch(
        organization_id,
        branch_id
    )
);

CREATE POLICY "sales_cashier_insert"
ON public.sales
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_jwt_role('CASHIER')
    AND public.is_same_org_and_branch(
        organization_id,
        branch_id
    )
);


----------------------------------------------------------------------
-- WASTE RECORDS
--
-- organization_id + branch_id
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "waste_records_cashier_select"
ON public.waste_records;

DROP POLICY IF EXISTS
    "waste_records_cashier_insert"
ON public.waste_records;

CREATE POLICY "waste_records_cashier_select"
ON public.waste_records
FOR SELECT
TO authenticated
USING (
    public.has_jwt_role('CASHIER')
    AND public.is_same_org_and_branch(
        organization_id,
        branch_id
    )
);

CREATE POLICY "waste_records_cashier_insert"
ON public.waste_records
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_jwt_role('CASHIER')
    AND public.is_same_org_and_branch(
        organization_id,
        branch_id
    )
);


----------------------------------------------------------------------
-- AUDIT SESSIONS
--
-- organization_id + branch_id
--
-- CASHIER:
--   INSERT solamente si la sesión pertenece a su organización/sucursal
--   y started_by coincide con su usuario.
--
--   UPDATE solamente de sus propias sesiones.
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "audit_sessions_cashier_insert"
ON public.audit_sessions;

DROP POLICY IF EXISTS
    "audit_sessions_cashier_update"
ON public.audit_sessions;

CREATE POLICY "audit_sessions_cashier_insert"
ON public.audit_sessions
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_jwt_role('CASHIER')
    AND started_by = auth.uid()
    AND public.is_same_org_and_branch(
        organization_id,
        branch_id
    )
);

CREATE POLICY "audit_sessions_cashier_update"
ON public.audit_sessions
FOR UPDATE
TO authenticated
USING (
    public.has_jwt_role('CASHIER')
    AND started_by = auth.uid()
    AND public.is_same_org_and_branch(
        organization_id,
        branch_id
    )
)
WITH CHECK (
    public.has_jwt_role('CASHIER')
    AND started_by = auth.uid()
    AND public.is_same_org_and_branch(
        organization_id,
        branch_id
    )
);

COMMIT;