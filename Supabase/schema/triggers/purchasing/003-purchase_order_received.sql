BEGIN;

DROP TRIGGER IF EXISTS trg_purchase_order_received
ON public.purchase_orders;

CREATE TRIGGER trg_purchase_order_received
BEFORE UPDATE
ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.register_purchase_inventory_movements();

COMMIT;