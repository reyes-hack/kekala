BEGIN;

------------------------------------------------------------------
-- Eliminar trigger anterior (si existe)
------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_inventory_movements_after_insert
ON public.inventory_movements;

------------------------------------------------------------------
-- AFTER INSERT
------------------------------------------------------------------

CREATE TRIGGER trg_inventory_movements_after_insert
AFTER INSERT
ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION public.sync_branch_inventory();

COMMIT;