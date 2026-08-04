BEGIN;

COMMENT ON TABLE public.transfer_orders IS
'Órdenes de transferencia de inventario entre sucursales.';

COMMENT ON COLUMN public.transfer_orders.id IS 'Identificador único de la transferencia.';
COMMENT ON COLUMN public.transfer_orders.organization_id IS 'Organización propietaria.';
COMMENT ON COLUMN public.transfer_orders.source_branch_id IS 'Sucursal origen.';
COMMENT ON COLUMN public.transfer_orders.destination_branch_id IS 'Sucursal destino.';
COMMENT ON COLUMN public.transfer_orders.transfer_number IS 'Folio único de la transferencia.';
COMMENT ON COLUMN public.transfer_orders.status_id IS 'Estado actual de la transferencia.';
COMMENT ON COLUMN public.transfer_orders.requested_by IS 'Usuario que solicitó la transferencia.';
COMMENT ON COLUMN public.transfer_orders.received_by IS 'Usuario que confirmó la recepción.';
COMMENT ON COLUMN public.transfer_orders.transfer_date IS 'Fecha de envío.';
COMMENT ON COLUMN public.transfer_orders.received_date IS 'Fecha de recepción.';
COMMENT ON COLUMN public.transfer_orders.notes IS 'Observaciones.';
COMMENT ON COLUMN public.transfer_orders.metadata IS 'Información adicional en formato JSON.';
COMMENT ON COLUMN public.transfer_orders.created_at IS 'Fecha de creación.';
COMMENT ON COLUMN public.transfer_orders.updated_at IS 'Fecha de actualización.';

COMMIT;