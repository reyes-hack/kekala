BEGIN;

CREATE TRIGGER trg_inventory_movements_before_insert
BEFORE INSERT
ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_inventory_on_movement();

COMMIT;