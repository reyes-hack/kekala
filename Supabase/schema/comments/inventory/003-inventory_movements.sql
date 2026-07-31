BEGIN;

------------------------------------------------------------------
-- Tabla
------------------------------------------------------------------

COMMENT ON TABLE public.inventory_movements IS
'Historial inmutable de todos los movimientos de inventario del ERP. Cada registro representa una entrada o salida de existencias y constituye la fuente de verdad del inventario.';

------------------------------------------------------------------
-- Columnas
------------------------------------------------------------------

COMMENT ON COLUMN public.inventory_movements.id IS
'Identificador único del movimiento.';

COMMENT ON COLUMN public.inventory_movements.organization_id IS
'Organización propietaria del movimiento.';

COMMENT ON COLUMN public.inventory_movements.branch_id IS
'Sucursal donde ocurrió el movimiento.';

COMMENT ON COLUMN public.inventory_movements.product_id IS
'Producto afectado por el movimiento.';

COMMENT ON COLUMN public.inventory_movements.movement_type_id IS
'Tipo de movimiento obtenido del catálogo de movimientos de inventario.';

COMMENT ON COLUMN public.inventory_movements.quantity IS
'Cantidad del movimiento. Valores positivos representan entradas y valores negativos representan salidas.';

COMMENT ON COLUMN public.inventory_movements.previous_stock IS
'Existencia del producto antes de aplicar el movimiento. Este valor es calculado automáticamente por la base de datos.';

COMMENT ON COLUMN public.inventory_movements.current_stock IS
'Existencia del producto después de aplicar el movimiento. Este valor es calculado automáticamente por la base de datos.';

COMMENT ON COLUMN public.inventory_movements.reference_type IS
'Módulo o documento que originó el movimiento, por ejemplo PURCHASE, SALE, WASTE o TRANSFER.';

COMMENT ON COLUMN public.inventory_movements.reference_id IS
'Identificador del documento que originó el movimiento.';

COMMENT ON COLUMN public.inventory_movements.notes IS
'Observaciones adicionales del movimiento.';

COMMENT ON COLUMN public.inventory_movements.created_by IS
'Usuario que registró el movimiento. La relación se implementará cuando exista el módulo de usuarios.';

COMMENT ON COLUMN public.inventory_movements.created_at IS
'Fecha y hora de creación del movimiento.';

COMMIT;