BEGIN;

-- =====================================================
-- TABLA
-- =====================================================

COMMENT ON TABLE public.external_sales_reports IS
'Almacena reportes agregados de ventas importados desde sistemas externos (Foodbot, Uber Eats, Rappi, Shopify, etc.). No representa ventas transaccionales del ERP.';

-- =====================================================
-- COLUMNAS
-- =====================================================

COMMENT ON COLUMN public.external_sales_reports.id IS
'Identificador único del reporte importado.';

COMMENT ON COLUMN public.external_sales_reports.organization_id IS
'Organización propietaria del reporte.';

COMMENT ON COLUMN public.external_sales_reports.branch_id IS
'Sucursal a la que pertenece el reporte diario.';

COMMENT ON COLUMN public.external_sales_reports.source IS
'Proveedor origen de la información (ej. FOODBOT, UBER, RAPPI, SHOPIFY).';

COMMENT ON COLUMN public.external_sales_reports.report_date IS
'Fecha correspondiente al resumen de ventas importado.';

COMMENT ON COLUMN public.external_sales_reports.total_orders IS
'Cantidad total de órdenes registradas por el proveedor durante la fecha del reporte.';

COMMENT ON COLUMN public.external_sales_reports.total_sales IS
'Monto total de ventas reportado por el proveedor para la fecha indicada.';

COMMENT ON COLUMN public.external_sales_reports.average_ticket IS
'Valor promedio por orden calculado por el proveedor externo.';

COMMENT ON COLUMN public.external_sales_reports.raw_data IS
'JSON original recibido durante la importación. Se conserva para auditoría y reprocesamiento.';

COMMENT ON COLUMN public.external_sales_reports.imported_at IS
'Fecha y hora en que el ERP importó el reporte externo.';

COMMENT ON COLUMN public.external_sales_reports.created_at IS
'Fecha y hora de creación del registro dentro del ERP.';

COMMENT ON COLUMN public.external_sales_reports.updated_at IS
'Fecha y hora de la última modificación del registro.';

COMMIT;