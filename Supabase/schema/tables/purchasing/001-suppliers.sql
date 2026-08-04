BEGIN;

CREATE TABLE IF NOT EXISTS public.suppliers (

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
    -- Identificación
    ------------------------------------------------------------------

    supplier_code TEXT NOT NULL,

    name TEXT NOT NULL,

    legal_name TEXT,

    tax_id TEXT,

    ------------------------------------------------------------------
    -- Contacto
    ------------------------------------------------------------------

    contact_name TEXT,

    email TEXT,

    phone TEXT,

    ------------------------------------------------------------------
    -- Dirección
    ------------------------------------------------------------------

    address TEXT,

    city TEXT,

    state TEXT,

    postal_code TEXT,

    country_code CHAR(2) NOT NULL
        DEFAULT 'MX',

    ------------------------------------------------------------------
    -- Información adicional
    ------------------------------------------------------------------

    notes TEXT,

    metadata JSONB NOT NULL
        DEFAULT '{}'::jsonb,

    ------------------------------------------------------------------
    -- Estado
    ------------------------------------------------------------------

    is_active BOOLEAN NOT NULL
        DEFAULT TRUE,

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

    CONSTRAINT fk_suppliers_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    ------------------------------------------------------------------
    -- Restricciones
    ------------------------------------------------------------------

    CONSTRAINT uq_suppliers_code
        UNIQUE (
            organization_id,
            supplier_code
        ),

    CONSTRAINT chk_suppliers_metadata
        CHECK (
            jsonb_typeof(metadata) = 'object'
        )

);

COMMIT;