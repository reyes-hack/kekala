BEGIN;

DROP TRIGGER IF EXISTS trg_sale_items_inventory
ON public.sale_items;

CREATE TRIGGER trg_sale_items_inventory
AFTER INSERT
ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.register_sale_inventory_movement();

COMMIT;