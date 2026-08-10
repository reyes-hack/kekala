BEGIN;

----------------------------------------------------------------------
-- 1. BRANCH INVENTORY
--
-- Solo ADMIN.
-- CASHIER nunca puede consultar ni modificar stock teórico.
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "Permitir actualizacion publica de inventario por sucursal"
ON public.branch_inventory;

DROP POLICY IF EXISTS
    "Permitir insercion publica de inventario por sucursal"
ON public.branch_inventory;

DROP POLICY IF EXISTS
    "Permitir lectura publica de inventario por sucursal"
ON public.branch_inventory;

DROP POLICY IF EXISTS
    "branch_inventory_select_policy"
ON public.branch_inventory;

CREATE POLICY "branch_inventory_admin_select"
ON public.branch_inventory
FOR SELECT
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "branch_inventory_admin_insert"
ON public.branch_inventory
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "branch_inventory_admin_update"
ON public.branch_inventory
FOR UPDATE
TO authenticated
USING (
    public.is_jwt_admin()
)
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "branch_inventory_admin_delete"
ON public.branch_inventory
FOR DELETE
TO authenticated
USING (
    public.is_jwt_admin()
);


----------------------------------------------------------------------
-- 2. EXPENSES
--
-- ADMIN: acceso completo.
-- CASHIER: SELECT e INSERT solamente en su sucursal.
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "Allow all operations on expenses"
ON public.expenses;

DROP POLICY IF EXISTS
    "expenses_select_policy"
ON public.expenses;

CREATE POLICY "expenses_admin_select"
ON public.expenses
FOR SELECT
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "expenses_admin_insert"
ON public.expenses
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "expenses_admin_update"
ON public.expenses
FOR UPDATE
TO authenticated
USING (
    public.is_jwt_admin()
)
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "expenses_admin_delete"
ON public.expenses
FOR DELETE
TO authenticated
USING (
    public.is_jwt_admin()
);

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
-- 3. INVENTORY MOVEMENTS
--
-- Solo ADMIN.
-- CASHIER no puede escribir directamente al libro mayor.
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "Permitir insercion publica de movimientos de inventario"
ON public.inventory_movements;

DROP POLICY IF EXISTS
    "Permitir lectura publica de movimientos de inventario"
ON public.inventory_movements;

DROP POLICY IF EXISTS
    "inventory_movements_select_policy"
ON public.inventory_movements;

CREATE POLICY "inventory_movements_admin_select"
ON public.inventory_movements
FOR SELECT
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "inventory_movements_admin_insert"
ON public.inventory_movements
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "inventory_movements_admin_update"
ON public.inventory_movements
FOR UPDATE
TO authenticated
USING (
    public.is_jwt_admin()
)
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "inventory_movements_admin_delete"
ON public.inventory_movements
FOR DELETE
TO authenticated
USING (
    public.is_jwt_admin()
);


----------------------------------------------------------------------
-- 4. PURCHASE ORDERS
--
-- ADMIN: acceso completo.
-- CASHIER: sin acceso directo.
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "Allow all operations on purchase_orders"
ON public.purchase_orders;

DROP POLICY IF EXISTS
    "purchase_orders_select_policy"
ON public.purchase_orders;

CREATE POLICY "purchase_orders_admin_select"
ON public.purchase_orders
FOR SELECT
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "purchase_orders_admin_insert"
ON public.purchase_orders
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "purchase_orders_admin_update"
ON public.purchase_orders
FOR UPDATE
TO authenticated
USING (
    public.is_jwt_admin()
)
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "purchase_orders_admin_delete"
ON public.purchase_orders
FOR DELETE
TO authenticated
USING (
    public.is_jwt_admin()
);


----------------------------------------------------------------------
-- 5. SALES
--
-- ADMIN: acceso completo.
-- CASHIER: SELECT e INSERT en su sucursal.
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "sales_select_policy"
ON public.sales;

CREATE POLICY "sales_admin_select"
ON public.sales
FOR SELECT
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "sales_admin_insert"
ON public.sales
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "sales_admin_update"
ON public.sales
FOR UPDATE
TO authenticated
USING (
    public.is_jwt_admin()
)
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "sales_admin_delete"
ON public.sales
FOR DELETE
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "sales_cashier_select"
ON public.sales
FOR SELECT
TO authenticated
USING (
    public.has_jwt_role('CASHIER')
    AND public.is_same_branch(branch_id)
);

CREATE POLICY "sales_cashier_insert"
ON public.sales
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_jwt_role('CASHIER')
    AND public.is_same_branch(branch_id)
);


----------------------------------------------------------------------
-- 6. WASTE RECORDS
--
-- ADMIN: acceso completo.
-- CASHIER: SELECT e INSERT en su sucursal.
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "waste_records_select_policy"
ON public.waste_records;

CREATE POLICY "waste_records_admin_select"
ON public.waste_records
FOR SELECT
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "waste_records_admin_insert"
ON public.waste_records
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "waste_records_admin_update"
ON public.waste_records
FOR UPDATE
TO authenticated
USING (
    public.is_jwt_admin()
)
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "waste_records_admin_delete"
ON public.waste_records
FOR DELETE
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "waste_records_cashier_select"
ON public.waste_records
FOR SELECT
TO authenticated
USING (
    public.has_jwt_role('CASHIER')
    AND public.is_same_branch(branch_id)
);

CREATE POLICY "waste_records_cashier_insert"
ON public.waste_records
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_jwt_role('CASHIER')
    AND public.is_same_branch(branch_id)
);


----------------------------------------------------------------------
-- 7. AUDIT SESSIONS
--
-- ADMIN: acceso completo.
-- CASHIER:
--   INSERT de sesiones.
--   UPDATE únicamente sus propias sesiones.
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "audit_sessions_admin_select"
ON public.audit_sessions;

DROP POLICY IF EXISTS
    "audit_sessions_employee_insert"
ON public.audit_sessions;

DROP POLICY IF EXISTS
    "audit_sessions_employee_update"
ON public.audit_sessions;

CREATE POLICY "audit_sessions_admin_select"
ON public.audit_sessions
FOR SELECT
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "audit_sessions_admin_insert"
ON public.audit_sessions
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "audit_sessions_admin_update"
ON public.audit_sessions
FOR UPDATE
TO authenticated
USING (
    public.is_jwt_admin()
)
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "audit_sessions_admin_delete"
ON public.audit_sessions
FOR DELETE
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "audit_sessions_cashier_insert"
ON public.audit_sessions
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_jwt_role('CASHIER')
    AND started_by = auth.uid()
    AND public.is_same_branch(branch_id)
);

CREATE POLICY "audit_sessions_cashier_update"
ON public.audit_sessions
FOR UPDATE
TO authenticated
USING (
    public.has_jwt_role('CASHIER')
    AND started_by = auth.uid()
    AND public.is_same_branch(branch_id)
)
WITH CHECK (
    public.has_jwt_role('CASHIER')
    AND started_by = auth.uid()
    AND public.is_same_branch(branch_id)
);


----------------------------------------------------------------------
-- 8. AUDIT COUNTS
--
-- ADMIN: acceso completo.
-- CASHIER: INSERT únicamente.
-- CASHIER NO tiene SELECT.
--
-- El expected_stock y difference son calculados por trigger.
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "audit_counts_admin_select"
ON public.audit_counts;

DROP POLICY IF EXISTS
    "audit_counts_employee_insert"
ON public.audit_counts;

CREATE POLICY "audit_counts_admin_select"
ON public.audit_counts
FOR SELECT
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "audit_counts_admin_insert"
ON public.audit_counts
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "audit_counts_admin_update"
ON public.audit_counts
FOR UPDATE
TO authenticated
USING (
    public.is_jwt_admin()
)
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "audit_counts_admin_delete"
ON public.audit_counts
FOR DELETE
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "audit_counts_cashier_insert"
ON public.audit_counts
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_jwt_role('CASHIER')
);


----------------------------------------------------------------------
-- 9. TRANSFER ORDERS
--
-- ADMIN: acceso completo.
-- CASHIER: sin acceso directo.
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "transfer_orders_select_policy"
ON public.transfer_orders;

CREATE POLICY "transfer_orders_admin_select"
ON public.transfer_orders
FOR SELECT
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "transfer_orders_admin_insert"
ON public.transfer_orders
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "transfer_orders_admin_update"
ON public.transfer_orders
FOR UPDATE
TO authenticated
USING (
    public.is_jwt_admin()
)
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "transfer_orders_admin_delete"
ON public.transfer_orders
FOR DELETE
TO authenticated
USING (
    public.is_jwt_admin()
);


----------------------------------------------------------------------
-- 10. PROFILES
--
-- Un usuario puede consultar su propio perfil.
-- ADMIN puede administrar todos.
--
-- No permitimos que CASHIER modifique libremente su organización,
-- sucursal o identidad desde el frontend.
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "profiles_select_policy"
ON public.profiles;

DROP POLICY IF EXISTS
    "profiles_update_policy"
ON public.profiles;

CREATE POLICY "profiles_self_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
);

CREATE POLICY "profiles_admin_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "profiles_admin_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    public.is_jwt_admin()
)
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "profiles_admin_insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "profiles_admin_delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (
    public.is_jwt_admin()
);


COMMIT;