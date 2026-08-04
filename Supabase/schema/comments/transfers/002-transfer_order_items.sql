BEGIN;

COMMENT ON TABLE public.transfer_order_items IS
'Detalle de productos incluidos en una transferencia entre sucursales.';

COMMENT ON COLUMN public.transfer_order_items.id IS
'Identificador único del detalle.';

COMMENT ON COLUMN public.transfer_order_items.organization_id IS
'Organización propietaria del registro.';

COMMENT ON COLUMN public.transfer_order_items.transfer_order_id IS
'Transferencia a la que pertenece el producto.';

COMMENT ON COLUMN public.transfer_order_items.product_id IS
'Producto transferido entre sucursales.';

COMMENT ON COLUMN public.transfer_order_items.quantity_requested IS
'Cantidad solicitada para transferir.';

COMMENT ON COLUMN public.transfer_order_items.quantity_sent IS
'Cantidad efectivamente enviada desde la sucursal origen.';

COMMENT ON COLUMN public.transfer_order_items.quantity_received IS
'Cantidad recibida por la sucursal destino.';

COMMENT ON COLUMN public.transfer_order_items.created_at IS
'Fecha y hora de creación del registro.';

COMMIT;