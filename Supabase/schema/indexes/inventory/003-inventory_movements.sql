BEGIN;

------------------------------------------------------------------
-- Organización
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_inventory_movements_organization
ON public.inventory_movements (organization_id);

------------------------------------------------------------------
-- Sucursal
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_inventory_movements_branch
ON public.inventory_movements (branch_id);

------------------------------------------------------------------
-- Producto
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product
ON public.inventory_movements (product_id);

------------------------------------------------------------------
-- Tipo de movimiento
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_inventory_movements_movement_type
ON public.inventory_movements (movement_type_id);

------------------------------------------------------------------
-- Fecha del movimiento
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at
ON public.inventory_movements (created_at);

------------------------------------------------------------------
-- Documento origen
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference
ON public.inventory_movements (
    reference_type,
    reference_id
);

------------------------------------------------------------------
-- Dashboard:
-- Historial de un producto
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_created
ON public.inventory_movements (
    product_id,
    created_at
);

------------------------------------------------------------------
-- Dashboard:
-- Movimientos por sucursal
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_inventory_movements_branch_created
ON public.inventory_movements (
    branch_id,
    created_at
);

------------------------------------------------------------------
-- Dashboard:
-- Organización + Fecha
------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_inventory_movements_org_created
ON public.inventory_movements (
    organization_id,
    created_at
);

COMMIT;