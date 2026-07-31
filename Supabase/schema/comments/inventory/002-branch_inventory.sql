BEGIN;

------------------------------------------------------------------
-- Tabla
------------------------------------------------------------------

COMMENT ON TABLE public.branch_inventory IS
'Inventario actual por sucursal. Representa el estado derivado de los movimientos de inventario y no debe modificarse directamente desde la aplicación.';

------------------------------------------------------------------
-- Columnas
------------------------------------------------------------------

COMMENT ON COLUMN public.branch_inventory.id IS
'Identificador único del registro de inventario.';

COMMENT ON COLUMN public.branch_inventory.organization_id IS
'Organización propietaria del inventario.';

COMMENT ON COLUMN public.branch_inventory.branch_id IS
'Sucursal donde se encuentra el inventario.';

COMMENT ON COLUMN public.branch_inventory.product_id IS
'Producto al que pertenece la existencia.';

COMMENT ON COLUMN public.branch_inventory.current_stock IS
'Existencia actual disponible del producto en la sucursal.';

COMMENT ON COLUMN public.branch_inventory.minimum_stock IS
'Cantidad mínima recomendada antes de generar una alerta de reabastecimiento.';

COMMENT ON COLUMN public.branch_inventory.maximum_stock IS
'Cantidad máxima recomendada para mantener en inventario.';

COMMENT ON COLUMN public.branch_inventory.is_active IS
'Indica si el registro de inventario permanece activo.';

COMMENT ON COLUMN public.branch_inventory.created_at IS
'Fecha y hora de creación del registro.';

COMMENT ON COLUMN public.branch_inventory.updated_at IS
'Fecha y hora de la última actualización del registro.';

COMMIT;