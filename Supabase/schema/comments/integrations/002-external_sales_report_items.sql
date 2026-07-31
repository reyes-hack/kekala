BEGIN;

------------------------------------------------------------------
-- Tabla
------------------------------------------------------------------

COMMENT ON TABLE public.external_sales_report_items IS
'Detalle de productos vendidos en un reporte diario importado desde un proveedor externo.';

------------------------------------------------------------------
-- Columnas
------------------------------------------------------------------

COMMENT ON COLUMN public.external_sales_report_items.id IS
'Identificador único del registro.';

COMMENT ON COLUMN public.external_sales_report_items.organization_id IS
'Organización propietaria del registro.';

COMMENT ON COLUMN public.external_sales_report_items.report_id IS
'Reporte diario al que pertenece este producto vendido.';

COMMENT ON COLUMN public.external_sales_report_items.product_id IS
'Producto del ERP relacionado. Puede permanecer NULL hasta que el producto sea conciliado con el catálogo interno.';

COMMENT ON COLUMN public.external_sales_report_items.source_product_code IS
'Código del producto enviado por el sistema origen.';

COMMENT ON COLUMN public.external_sales_report_items.source_product_name IS
'Nombre del producto enviado por el sistema origen.';

COMMENT ON COLUMN public.external_sales_report_items.orders_count IS
'Cantidad de órdenes que incluyen este producto.';

COMMENT ON COLUMN public.external_sales_report_items.quantity_sold IS
'Cantidad total de unidades vendidas.';

COMMENT ON COLUMN public.external_sales_report_items.total_sales IS
'Importe total vendido para este producto en el reporte.';

COMMENT ON COLUMN public.external_sales_report_items.raw_data IS
'Información original recibida del proveedor en formato JSON.';

COMMENT ON COLUMN public.external_sales_report_items.created_at IS
'Fecha y hora de creación del registro.';

COMMENT ON COLUMN public.external_sales_report_items.updated_at IS
'Fecha y hora de la última actualización del registro.';

COMMIT;