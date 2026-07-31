BEGIN;

-- =====================================================
-- Organización
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_external_sales_report_items_organization
ON public.external_sales_report_items (organization_id);

-- =====================================================
-- Reporte diario
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_external_sales_report_items_report
ON public.external_sales_report_items (report_id);

-- =====================================================
-- Producto ERP
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_external_sales_report_items_product
ON public.external_sales_report_items (product_id);

-- =====================================================
-- Código del proveedor
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_external_sales_report_items_source_product_code
ON public.external_sales_report_items (source_product_code);

-- =====================================================
-- Dashboard:
-- Organización + Reporte
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_external_sales_report_items_org_report
ON public.external_sales_report_items (
    organization_id,
    report_id
);

-- =====================================================
-- Dashboard:
-- Producto ERP + Organización
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_external_sales_report_items_product_org
ON public.external_sales_report_items (
    product_id,
    organization_id
);

COMMIT;