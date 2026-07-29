-- =====================================================
-- TABLE: catalog_values
-- Module: Catalogs
-- Description:
-- Stores the values of each catalog type used
-- throughout the ERP.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.catalog_values (

    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationship
    catalog_type_id UUID NOT NULL,

    -- Business Identity
    code TEXT NOT NULL,

    name TEXT NOT NULL,

    description TEXT,

    -- UI Configuration
    sort_order INTEGER NOT NULL DEFAULT 0,

    color TEXT,

    icon TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Status
    is_system BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Relationships
    CONSTRAINT catalog_values_catalog_type_fk
        FOREIGN KEY (catalog_type_id)
        REFERENCES public.catalog_types(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    -- Business Rules
    CONSTRAINT catalog_values_code_unique
        UNIQUE (catalog_type_id, code),

    CONSTRAINT catalog_values_name_unique
        UNIQUE (catalog_type_id, name),

    CONSTRAINT catalog_values_code_format_check
        CHECK (
            code ~ '^[A-Z][A-Z0-9_]*$'
        ),

    CONSTRAINT catalog_values_sort_order_check
        CHECK (
            sort_order >= 0
        ),

    CONSTRAINT catalog_values_metadata_check
        CHECK (
            jsonb_typeof(metadata) = 'object'
        )

);