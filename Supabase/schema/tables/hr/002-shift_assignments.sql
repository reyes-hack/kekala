BEGIN;

CREATE TABLE IF NOT EXISTS public.shift_assignments (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Relaciones
    ------------------------------------------------------------------

    organization_id UUID NOT NULL,

    shift_id UUID NOT NULL,

    profile_id UUID NOT NULL,

    ------------------------------------------------------------------
    -- Día de la semana (0=Lunes ... 6=Domingo)
    ------------------------------------------------------------------

    day_of_week SMALLINT NOT NULL,

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

    CONSTRAINT fk_shift_assignments_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_shift_assignments_shift
        FOREIGN KEY (shift_id)
        REFERENCES public.shifts(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_shift_assignments_profile
        FOREIGN KEY (profile_id)
        REFERENCES public.profiles(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    ------------------------------------------------------------------
    -- Restricciones
    ------------------------------------------------------------------

    CONSTRAINT uq_shift_assignments
        UNIQUE (shift_id, profile_id, day_of_week),

    CONSTRAINT chk_shift_assignments_day
        CHECK (day_of_week BETWEEN 0 AND 6)

);

COMMIT;
