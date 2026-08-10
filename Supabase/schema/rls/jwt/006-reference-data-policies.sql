BEGIN;

----------------------------------------------------------------------
-- 1. BRANCHES
--
-- ADMIN:
--   CRUD sobre todas las sucursales.
--
-- CASHIER:
--   SELECT únicamente de su propia sucursal.
----------------------------------------------------------------------

CREATE POLICY "branches_admin_select"
ON public.branches
FOR SELECT
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "branches_admin_insert"
ON public.branches
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "branches_admin_update"
ON public.branches
FOR UPDATE
TO authenticated
USING (
    public.is_jwt_admin()
)
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "branches_admin_delete"
ON public.branches
FOR DELETE
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "branches_cashier_select"
ON public.branches
FOR SELECT
TO authenticated
USING (
    public.has_jwt_role('CASHIER')
    AND public.is_same_org_and_branch(
        organization_id,
        id
    )
);


----------------------------------------------------------------------
-- 2. CATALOG TYPES
--
-- Los catálogos son datos de referencia.
-- Usuarios autenticados pueden consultarlos.
-- Solo ADMIN puede modificarlos.
----------------------------------------------------------------------

CREATE POLICY "catalog_types_authenticated_select"
ON public.catalog_types
FOR SELECT
TO authenticated
USING (
    true
);

CREATE POLICY "catalog_types_admin_insert"
ON public.catalog_types
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "catalog_types_admin_update"
ON public.catalog_types
FOR UPDATE
TO authenticated
USING (
    public.is_jwt_admin()
)
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "catalog_types_admin_delete"
ON public.catalog_types
FOR DELETE
TO authenticated
USING (
    public.is_jwt_admin()
);


----------------------------------------------------------------------
-- 3. CATALOG VALUES
--
-- Datos de referencia.
-- Usuarios autenticados pueden consultarlos.
-- Solo ADMIN puede modificarlos.
----------------------------------------------------------------------

CREATE POLICY "catalog_values_authenticated_select"
ON public.catalog_values
FOR SELECT
TO authenticated
USING (
    true
);

CREATE POLICY "catalog_values_admin_insert"
ON public.catalog_values
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "catalog_values_admin_update"
ON public.catalog_values
FOR UPDATE
TO authenticated
USING (
    public.is_jwt_admin()
)
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "catalog_values_admin_delete"
ON public.catalog_values
FOR DELETE
TO authenticated
USING (
    public.is_jwt_admin()
);


----------------------------------------------------------------------
-- 4. FOODBOT MAPPINGS
--
-- Información administrativa del recetario/BOM.
--
-- ADMIN:
--   CRUD completo.
--
-- CASHIER:
--   Sin acceso.
----------------------------------------------------------------------

CREATE POLICY "foodbot_mappings_admin_select"
ON public.foodbot_mappings
FOR SELECT
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "foodbot_mappings_admin_insert"
ON public.foodbot_mappings
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "foodbot_mappings_admin_update"
ON public.foodbot_mappings
FOR UPDATE
TO authenticated
USING (
    public.is_jwt_admin()
)
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "foodbot_mappings_admin_delete"
ON public.foodbot_mappings
FOR DELETE
TO authenticated
USING (
    public.is_jwt_admin()
);


----------------------------------------------------------------------
-- 5. PRODUCTS
--
-- ADMIN:
--   CRUD completo.
--
-- CASHIER:
--   La lectura se habilitará mediante una interfaz segura de catálogo
--   para POS que no exponga cost_price ni box_price.
--
-- IMPORTANTE:
--   RLS no permite ocultar columnas. Por eso NO creamos aquí una
--   política SELECT para CASHIER sobre public.products.
----------------------------------------------------------------------

CREATE POLICY "products_admin_select"
ON public.products
FOR SELECT
TO authenticated
USING (
    public.is_jwt_admin()
);

CREATE POLICY "products_admin_insert"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "products_admin_update"
ON public.products
FOR UPDATE
TO authenticated
USING (
    public.is_jwt_admin()
)
WITH CHECK (
    public.is_jwt_admin()
);

CREATE POLICY "products_admin_delete"
ON public.products
FOR DELETE
TO authenticated
USING (
    public.is_jwt_admin()
);

COMMIT;