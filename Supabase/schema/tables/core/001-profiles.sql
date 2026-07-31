BEGIN;

CREATE TABLE IF NOT EXISTS public.profiles (

    ------------------------------------------------------------------
    -- Primary Key (1:1 con Supabase Auth)
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    ------------------------------------------------------------------
    -- Organización
    ------------------------------------------------------------------

    organization_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Información personal
    ------------------------------------------------------------------

    first_name TEXT NOT NULL,

    last_name TEXT NOT NULL,

    display_name TEXT,

    email TEXT,

    phone TEXT,

    avatar_url TEXT,

    ------------------------------------------------------------------
    -- Relación organizacional
    ------------------------------------------------------------------

    branch_id UUID,

    ------------------------------------------------------------------
    -- Estado
    ------------------------------------------------------------------

    is_active BOOLEAN NOT NULL
        DEFAULT TRUE,

    ------------------------------------------------------------------
    -- Preferencias
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
    -- Foreign Keys
    ------------------------------------------------------------------

    CONSTRAINT fk_profiles_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_profiles_branch
        FOREIGN KEY (branch_id)
        REFERENCES public.branches(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    ------------------------------------------------------------------
    -- Validaciones
    ------------------------------------------------------------------

    CONSTRAINT chk_profiles_metadata
        CHECK (
            jsonb_typeof(metadata) = 'object'
        )

);

COMMIT;