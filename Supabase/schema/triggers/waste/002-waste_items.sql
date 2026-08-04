BEGIN;

DROP TRIGGER IF EXISTS trg_waste_items_inventory
ON public.waste_items;

CREATE TRIGGER trg_waste_items_inventory
AFTER INSERT
ON public.waste_items
FOR EACH ROW
EXECUTE FUNCTION public.register_waste_inventory_movement();

COMMIT;