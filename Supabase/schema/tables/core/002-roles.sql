BEGIN;

CREATE TABLE IF NOT EXISTS public.roles (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Identificación
    ------------------------------------------------------------------

    code TEXT NOT NULL,

    name TEXT NOT NULL,

    description TEXT,

    ------------------------------------------------------------------
    -- Estado
    ------------------------------------------------------------------

    is_system BOOLEAN NOT NULL
        DEFAULT TRUE,

    is_active BOOLEAN NOT NULL
        DEFAULT TRUE,

    ------------------------------------------------------------------
    -- Configuración
    ------------------------------------------------------------------

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
    -- Restricciones
    ------------------------------------------------------------------

    CONSTRAINT uq_roles_code
        UNIQUE (code),

    CONSTRAINT uq_roles_name
        UNIQUE (name),

    CONSTRAINT chk_roles_code
        CHECK (
            code ~ '^[A-Z][A-Z0-9_]*$'
        ),

    CONSTRAINT chk_roles_metadata
        CHECK (
            jsonb_typeof(metadata) = 'object'
        )

);

COMMIT;