BEGIN;

CREATE TABLE IF NOT EXISTS public.transfer_orders (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Organización
    ------------------------------------------------------------------

    organization_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Sucursales
    ------------------------------------------------------------------

    source_branch_id UUID NOT NULL,

    destination_branch_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Identificación
    ------------------------------------------------------------------

    transfer_number TEXT NOT NULL,

    ------------------------------------------------------------------
    -- Relaciones
    ------------------------------------------------------------------

    status_id UUID NOT NULL,

    requested_by UUID NOT NULL,

    received_by UUID,

    ------------------------------------------------------------------
    -- Fechas
    ------------------------------------------------------------------

    transfer_date DATE NOT NULL,

    received_date DATE,

    ------------------------------------------------------------------
    -- Información
    ------------------------------------------------------------------

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

    CONSTRAINT fk_transfer_orders_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_transfer_orders_source_branch
        FOREIGN KEY (source_branch_id)
        REFERENCES public.branches(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_transfer_orders_destination_branch
        FOREIGN KEY (destination_branch_id)
        REFERENCES public.branches(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_transfer_orders_status
        FOREIGN KEY (status_id)
        REFERENCES public.catalog_values(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_transfer_orders_requested_by
        FOREIGN KEY (requested_by)
        REFERENCES public.profiles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_transfer_orders_received_by
        FOREIGN KEY (received_by)
        REFERENCES public.profiles(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    ------------------------------------------------------------------
    -- Restricciones
    ------------------------------------------------------------------

    CONSTRAINT uq_transfer_number
        UNIQUE (
            organization_id,
            transfer_number
        ),

    CONSTRAINT chk_transfer_branches
        CHECK (
            source_branch_id <> destination_branch_id
        ),

    CONSTRAINT chk_transfer_metadata
        CHECK (
            jsonb_typeof(metadata)='object'
        )

);

COMMIT;