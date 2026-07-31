BEGIN;

CREATE TABLE IF NOT EXISTS public.external_sales_report_items (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Relationships
    ------------------------------------------------------------------

    organization_id UUID NOT NULL,

    report_id UUID NOT NULL,

    -- Se enlazará cuando exista la tabla products
    product_id UUID NULL,

    ------------------------------------------------------------------
    -- Datos provenientes del proveedor externo
    ------------------------------------------------------------------

    source_product_code TEXT NOT NULL,

    source_product_name TEXT NOT NULL,

    ------------------------------------------------------------------
    -- KPIs del producto
    ------------------------------------------------------------------

    orders_count INTEGER NOT NULL
        DEFAULT 0,

    quantity_sold INTEGER NOT NULL
        DEFAULT 0,

    total_sales NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    ------------------------------------------------------------------
    -- Auditoría
    ------------------------------------------------------------------

    raw_data JSONB,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    ------------------------------------------------------------------
    -- Foreign Keys
    ------------------------------------------------------------------

    CONSTRAINT fk_external_sales_report_items_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id),

    CONSTRAINT fk_external_sales_report_items_report
        FOREIGN KEY (report_id)
        REFERENCES public.external_sales_reports(id)
        ON DELETE CASCADE,

    ------------------------------------------------------------------
    -- Unique Constraints
    ------------------------------------------------------------------

    CONSTRAINT uq_external_sales_report_items_report_product
        UNIQUE (
            report_id,
            source_product_code
        ),

    ------------------------------------------------------------------
    -- Check Constraints
    ------------------------------------------------------------------

    CONSTRAINT chk_external_sales_report_items_orders
        CHECK (
            orders_count >= 0
        ),

    CONSTRAINT chk_external_sales_report_items_quantity
        CHECK (
            quantity_sold >= 0
        ),

    CONSTRAINT chk_external_sales_report_items_sales
        CHECK (
            total_sales >= 0
        ),

    CONSTRAINT chk_external_sales_report_items_source_code
        CHECK (
            source_product_code = UPPER(source_product_code)
        ),

    CONSTRAINT chk_external_sales_report_items_source_name
        CHECK (
            LENGTH(TRIM(source_product_name)) > 0
        ),

    CONSTRAINT chk_external_sales_report_items_raw_data
        CHECK (
            raw_data IS NULL
            OR jsonb_typeof(raw_data) = 'object'
        )

);

COMMIT;