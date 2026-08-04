BEGIN;

COMMENT ON TABLE public.purchase_order_items IS
'Detalle de productos incluidos en una orden de compra.';

COMMENT ON COLUMN public.purchase_order_items.id IS
'Identificador único del detalle de la orden.';

COMMENT ON COLUMN public.purchase_order_items.organization_id IS
'Organización propietaria del registro.';

COMMENT ON COLUMN public.purchase_order_items.purchase_order_id IS
'Orden de compra a la que pertenece el producto.';

COMMENT ON COLUMN public.purchase_order_items.product_id IS
'Producto solicitado al proveedor.';

COMMENT ON COLUMN public.purchase_order_items.quantity_ordered IS
'Cantidad solicitada en la orden de compra.';

COMMENT ON COLUMN public.purchase_order_items.quantity_received IS
'Cantidad efectivamente recibida del proveedor.';

COMMENT ON COLUMN public.purchase_order_items.unit_cost IS
'Costo unitario acordado con el proveedor.';

COMMENT ON COLUMN public.purchase_order_items.subtotal IS
'Subtotal antes de impuestos.';

COMMENT ON COLUMN public.purchase_order_items.tax_amount IS
'Impuestos aplicados al producto.';

COMMENT ON COLUMN public.purchase_order_items.total_amount IS
'Importe total del producto en la orden.';

COMMENT ON COLUMN public.purchase_order_items.created_at IS
'Fecha y hora de creación del registro.';

COMMIT;