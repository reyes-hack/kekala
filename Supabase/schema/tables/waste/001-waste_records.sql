BEGIN;

CREATE TABLE IF NOT EXISTS public.waste_records (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Organización
    ------------------------------------------------------------------

    organization_id UUID NOT NULL,

    branch_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Identificación
    ------------------------------------------------------------------

    waste_number TEXT NOT NULL,

    ------------------------------------------------------------------
    -- Relaciones
    ------------------------------------------------------------------

    reported_by UUID NOT NULL,

    status_id UUID NOT NULL,

    reason_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Información
    ------------------------------------------------------------------

    waste_date DATE NOT NULL,

    total_cost NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    notes TEXT,

    metadata JSONB NOT NULL
        DEFAULT '{}'::jsonb,

    ------------------------------------------------------------------
    -- Auditoría
    ------------------------------------------------------------------

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    ------------------------------------------------------------------
    -- Foreign Keys
    ------------------------------------------------------------------

    CONSTRAINT fk_waste_records_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_waste_records_branch
        FOREIGN KEY (branch_id)
        REFERENCES public.branches(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_waste_records_reported_by
        FOREIGN KEY (reported_by)
        REFERENCES public.profiles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_waste_records_status
        FOREIGN KEY (status_id)
        REFERENCES public.catalog_values(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_waste_records_reason
        FOREIGN KEY (reason_id)
        REFERENCES public.catalog_values(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    ------------------------------------------------------------------
    -- Restricciones
    ------------------------------------------------------------------

    CONSTRAINT uq_waste_number
        UNIQUE (
            organization_id,
            waste_number
        ),

    CONSTRAINT chk_waste_total_cost
        CHECK (
            total_cost >= 0
        ),

    CONSTRAINT chk_waste_metadata
        CHECK (
            jsonb_typeof(metadata) = 'object'
        )

);

COMMIT;