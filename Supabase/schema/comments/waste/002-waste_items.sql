BEGIN;

COMMENT ON TABLE public.waste_items IS
'Detalle de productos incluidos en un reporte de merma.';

COMMENT ON COLUMN public.waste_items.id IS
'Identificador único del detalle de merma.';

COMMENT ON COLUMN public.waste_items.organization_id IS
'Organización propietaria del registro.';

COMMENT ON COLUMN public.waste_items.waste_record_id IS
'Reporte de merma al que pertenece el producto.';

COMMENT ON COLUMN public.waste_items.product_id IS
'Producto afectado por la merma.';

COMMENT ON COLUMN public.waste_items.quantity IS
'Cantidad de producto perdida.';

COMMENT ON COLUMN public.waste_items.unit_cost_at_time IS
'Costo unitario del producto al momento de registrar la merma.';

COMMENT ON COLUMN public.waste_items.subtotal_loss IS
'Costo total de la merma para este producto.';

COMMENT ON COLUMN public.waste_items.created_at IS
'Fecha y hora de creación del registro.';

COMMIT;