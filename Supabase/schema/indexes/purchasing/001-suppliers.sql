BEGIN;

CREATE INDEX IF NOT EXISTS idx_suppliers_organization
ON public.suppliers (organization_id);

CREATE INDEX IF NOT EXISTS idx_suppliers_name
ON public.suppliers (name);

CREATE INDEX IF NOT EXISTS idx_suppliers_active
ON public.suppliers (is_active);

CREATE INDEX IF NOT EXISTS idx_suppliers_country
ON public.suppliers (country_code);

COMMIT;