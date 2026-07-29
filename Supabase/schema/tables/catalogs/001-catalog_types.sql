-- =====================================================
-- TABLE: catalog_types
-- Module: Catalogs
-- Description:
-- Defines the available catalog types used throughout
-- the ERP.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.catalog_types (

    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Business Identity
    code TEXT NOT NULL,

    name TEXT NOT NULL,

    description TEXT,

    -- Configuration
    is_system BOOLEAN NOT NULL DEFAULT TRUE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT catalog_types_code_unique
        UNIQUE (code),

    CONSTRAINT catalog_types_name_unique
        UNIQUE (name)

);