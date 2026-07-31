BEGIN;

CREATE TABLE IF NOT EXISTS public.external_sales_reports (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    branch_id UUID NOT NULL,

    source TEXT NOT NULL,

    report_date DATE NOT NULL,

    total_orders INTEGER NOT NULL DEFAULT 0,

    total_sales NUMERIC(12,2) NOT NULL DEFAULT 0,

    average_ticket NUMERIC(12,2) NOT NULL DEFAULT 0,

    raw_data JSONB,

    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_external_sales_reports_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id),

    CONSTRAINT fk_external_sales_reports_branch
        FOREIGN KEY (branch_id)
        REFERENCES public.branches(id),

    CONSTRAINT uq_external_sales_reports
        UNIQUE (
            organization_id,
            branch_id,
            source,
            report_date
        ),

    CONSTRAINT chk_external_sales_reports_orders
        CHECK (total_orders >= 0),

    CONSTRAINT chk_external_sales_reports_sales
        CHECK (total_sales >= 0),

    CONSTRAINT chk_external_sales_reports_ticket
        CHECK (average_ticket >= 0),

    CONSTRAINT chk_external_sales_reports_source
        CHECK (
            source = UPPER(source)
        ),

    CONSTRAINT chk_external_sales_reports_raw_data
        CHECK (
            raw_data IS NULL
            OR jsonb_typeof(raw_data) = 'object'
        )

);

COMMIT;