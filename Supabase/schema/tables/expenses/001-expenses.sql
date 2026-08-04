BEGIN;

CREATE TABLE IF NOT EXISTS public.expenses (

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

    expense_number TEXT NOT NULL,

    ------------------------------------------------------------------
    -- Relaciones
    ------------------------------------------------------------------

    category_id UUID NOT NULL,

    establishment_id UUID NOT NULL,

    payment_method_id UUID NOT NULL,

    supplier_id UUID,

    created_by UUID NOT NULL,

    ------------------------------------------------------------------
    -- Información financiera
    ------------------------------------------------------------------

    currency_code CHAR(3) NOT NULL
        DEFAULT 'MXN',

    subtotal NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    tax_amount NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    total_amount NUMERIC(12,2) NOT NULL
        DEFAULT 0,

    ------------------------------------------------------------------
    -- Información del gasto
    ------------------------------------------------------------------

    expense_date DATE NOT NULL,

    description TEXT,

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

    CONSTRAINT fk_expenses_organization
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_expenses_branch
        FOREIGN KEY (branch_id)
        REFERENCES public.branches(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_expenses_category
        FOREIGN KEY (category_id)
        REFERENCES public.catalog_values(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_expenses_establishment
        FOREIGN KEY (establishment_id)
        REFERENCES public.catalog_values(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_expenses_payment_method
        FOREIGN KEY (payment_method_id)
        REFERENCES public.catalog_values(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_expenses_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES public.suppliers(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_expenses_created_by
        FOREIGN KEY (created_by)
        REFERENCES public.profiles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    ------------------------------------------------------------------
    -- Restricciones
    ------------------------------------------------------------------

    CONSTRAINT uq_expense_number
        UNIQUE (
            organization_id,
            expense_number
        ),

    CONSTRAINT chk_expenses_subtotal
        CHECK (
            subtotal >= 0
        ),

    CONSTRAINT chk_expenses_tax
        CHECK (
            tax_amount >= 0
        ),

    CONSTRAINT chk_expenses_total
        CHECK (
            total_amount >= 0
        ),

    CONSTRAINT chk_expenses_metadata
        CHECK (
            jsonb_typeof(metadata) = 'object'
        )

);

COMMIT;