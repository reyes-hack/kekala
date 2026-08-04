BEGIN;

COMMENT ON TABLE public.purchase_orders IS
'Órdenes de compra emitidas a proveedores para abastecer inventario.';

COMMENT ON COLUMN public.purchase_orders.id IS
'Identificador único de la orden de compra.';
COMMENT ON COLUMN public.purchase_orders.organization_id IS
'Organización propietaria de la orden.';
COMMENT ON COLUMN public.purchase_orders.branch_id IS
'Sucursal que recibirá la mercancía.';
COMMENT ON COLUMN public.purchase_orders.supplier_id IS
'Proveedor al que se emite la orden.';
COMMENT ON COLUMN public.purchase_orders.created_by IS
'Usuario que creó la orden de compra.';
COMMENT ON COLUMN public.purchase_orders.purchase_order_number IS
'Folio único de la orden de compra.';
COMMENT ON COLUMN public.purchase_orders.status_id IS
'Estado actual de la orden de compra.';
COMMENT ON COLUMN public.purchase_orders.expected_date IS
'Fecha estimada de recepción.';
COMMENT ON COLUMN public.purchase_orders.received_date IS
'Fecha real en que fue recibida.';
COMMENT ON COLUMN public.purchase_orders.subtotal IS
'Subtotal antes de descuentos e impuestos.';
COMMENT ON COLUMN public.purchase_orders.discount_amount IS
'Descuento aplicado a la orden.';
COMMENT ON COLUMN public.purchase_orders.tax_amount IS
'Impuestos de la orden.';
COMMENT ON COLUMN public.purchase_orders.total_amount IS
'Importe total de la orden.';
COMMENT ON COLUMN public.purchase_orders.notes IS
'Observaciones adicionales.';
COMMENT ON COLUMN public.purchase_orders.metadata IS
'Información adicional en formato JSON.';
COMMENT ON COLUMN public.purchase_orders.created_at IS
'Fecha y hora de creación.';
COMMENT ON COLUMN public.purchase_orders.updated_at IS
'Fecha y hora de la última actualización.';

COMMIT;