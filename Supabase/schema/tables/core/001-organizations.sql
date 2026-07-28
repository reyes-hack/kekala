-- =====================================================
-- TABLE: organizations
-- Description:
-- Stores the corporate information of the company that
-- owns the system.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.organizations (

    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Business Information
    name TEXT NOT NULL,

    legal_name TEXT,

    tax_id TEXT,

    -- Contact
    email TEXT,

    phone TEXT,

    -- Localization
    country_code CHAR(2) NOT NULL DEFAULT 'MX',

    currency_code CHAR(3) NOT NULL DEFAULT 'MXN',

    timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT organizations_name_unique UNIQUE (name),

    CONSTRAINT organizations_email_unique UNIQUE (email),

    CONSTRAINT organizations_currency_check
        CHECK (char_length(currency_code) = 3),

    CONSTRAINT organizations_country_check
        CHECK (char_length(country_code) = 2)

);