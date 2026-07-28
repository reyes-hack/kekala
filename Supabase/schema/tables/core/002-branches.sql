-- =====================================================
-- TABLE: branches
-- Description:
-- Stores the operational branches of an organization.
-- Every operational module in the ERP belongs to a branch.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.branches (

    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationship
    organization_id UUID NOT NULL,

    -- Business Information
    code TEXT NOT NULL,

    name TEXT NOT NULL,

    -- Location
    address TEXT,

    city TEXT,

    state TEXT,

    postal_code TEXT,

    country_code CHAR(2) NOT NULL DEFAULT 'MX',

    -- Contact
    email TEXT,

    phone TEXT,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT branches_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT branches_code_unique
        UNIQUE (organization_id, code),

    CONSTRAINT branches_name_unique
        UNIQUE (organization_id, name),

    CONSTRAINT branches_country_check
        CHECK (char_length(country_code) = 2)

);