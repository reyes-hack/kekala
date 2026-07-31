BEGIN;

-- =====================================================
-- Búsquedas por organización
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_external_sales_reports_organization
ON public.external_sales_reports (organization_id);

-- =====================================================
-- Búsquedas por sucursal
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_external_sales_reports_branch
ON public.external_sales_reports (branch_id);

-- =====================================================
-- Consultas por fecha
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_external_sales_reports_report_date
ON public.external_sales_reports (report_date);

-- =====================================================
-- Consultas por proveedor
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_external_sales_reports_source
ON public.external_sales_reports (source);

-- =====================================================
-- Dashboard:
-- organización + fecha
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_external_sales_reports_org_date
ON public.external_sales_reports (
    organization_id,
    report_date
);

-- =====================================================
-- Dashboard:
-- sucursal + fecha
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_external_sales_reports_branch_date
ON public.external_sales_reports (
    branch_id,
    report_date
);

COMMIT;