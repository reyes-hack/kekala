BEGIN;

------------------------------------------------------------------
-- Eliminar trigger anterior (si existe)
------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_inventory_movements_before_insert
ON public.inventory_movements;

------------------------------------------------------------------
-- BEFORE INSERT
------------------------------------------------------------------

CREATE TRIGGER trg_inventory_movements_before_insert
BEFORE INSERT
ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION public.calculate_inventory_movement();

COMMIT;