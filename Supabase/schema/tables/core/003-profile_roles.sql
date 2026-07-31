BEGIN;

CREATE TABLE IF NOT EXISTS public.profile_roles (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Relaciones
    ------------------------------------------------------------------

    profile_id UUID NOT NULL,

    role_id UUID NOT NULL,

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

    CONSTRAINT fk_profile_roles_profile
        FOREIGN KEY (profile_id)
        REFERENCES public.profiles(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_profile_roles_role
        FOREIGN KEY (role_id)
        REFERENCES public.roles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    ------------------------------------------------------------------
    -- Restricciones
    ------------------------------------------------------------------

    CONSTRAINT uq_profile_roles
        UNIQUE (
            profile_id,
            role_id
        )

);

COMMIT;