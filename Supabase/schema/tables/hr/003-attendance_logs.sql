BEGIN;

CREATE TABLE IF NOT EXISTS public.attendance_logs (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Relaciones
    ------------------------------------------------------------------

    organization_id UUID NOT NULL,

    branch_id UUID NOT NULL,

    profile_id UUID NOT NULL,

    shift_id UUID,

    ------------------------------------------------------------------
    -- Fecha del registro
    ------------------------------------------------------------------

    log_date DATE NOT NULL
        DEFAULT CURRENT_DATE,

    ------------------------------------------------------------------
    -- Check-in / Check-out
    ------------------------------------------------------------------

    check_in_at TIMESTAMPTZ,

    check_out_at TIMESTAMPTZ,

    ------------------------------------------------------------------
    -- Foto de asistencia (temporal, se borra al día siguiente)
    ------------------------------------------------------------------

    photo_url TEXT,

    ------------------------------------------------------------------
    -- Estado de asistencia
    ------------------------------------------------------------------

    status TEXT NOT NULL
        DEFAULT 'PENDING',

    ------------------------------------------------------------------
    -- Notas
    ------------------------------------------------------------------

    notes TEXT,

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

    CONSTRAINT fk_attendance_logs_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_attendance_logs_branch
        FOREIGN KEY (branch_id)
        REFERENCES public.branches(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_logs_profile
        FOREIGN KEY (profile_id)
        REFERENCES public.profiles(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_logs_shift
        FOREIGN KEY (shift_id)
        REFERENCES public.shifts(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    ------------------------------------------------------------------
    -- Restricciones
    ------------------------------------------------------------------

    CONSTRAINT uq_attendance_daily
        UNIQUE (profile_id, log_date),

    CONSTRAINT chk_attendance_status
        CHECK (status IN ('PENDING', 'ON_TIME', 'LATE', 'ABSENT')),

    CONSTRAINT chk_attendance_checkout
        CHECK (
            check_out_at IS NULL
            OR check_out_at >= check_in_at
        )

);

COMMIT;
