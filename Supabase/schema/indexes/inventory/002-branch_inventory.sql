BEGIN;

------------------------------------------------------------------
-- Organización
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_branch_inventory_organization
ON public.branch_inventory (organization_id);

------------------------------------------------------------------
-- Sucursal
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_branch_inventory_branch
ON public.branch_inventory (branch_id);

------------------------------------------------------------------
-- Producto
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_branch_inventory_product
ON public.branch_inventory (product_id);

------------------------------------------------------------------
-- Productos activos
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_branch_inventory_active
ON public.branch_inventory (is_active);

------------------------------------------------------------------
-- Consulta principal:
-- Inventario por sucursal
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_branch_inventory_branch_active
ON public.branch_inventory (
    branch_id,
    is_active
);

------------------------------------------------------------------
-- Consulta principal:
-- Existencia de un producto por sucursal
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_branch_inventory_branch_product
ON public.branch_inventory (
    branch_id,
    product_id
);

------------------------------------------------------------------
-- Dashboard:
-- Inventario por organización
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_branch_inventory_org_product
ON public.branch_inventory (
    organization_id,
    product_id
);

COMMIT;