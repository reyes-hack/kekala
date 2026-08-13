BEGIN;

-- 1. Create system_settings table for global configurations
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id)
);

-- Insert default global sync state (Enabled)
INSERT INTO public.system_settings (key, value, description)
VALUES ('FOODBOT_SYNC_GLOBAL_ENABLED', 'true'::jsonb, 'Toggle to globally enable or disable the automated 4-hour Foodbot synchronization')
ON CONFLICT (key) DO NOTHING;

-- 2. Create sync_history table
CREATE TABLE IF NOT EXISTS public.sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'SUCCESS', 'ERROR'
    message TEXT,
    results JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add schedule configuration columns to branches table
ALTER TABLE public.branches
ADD COLUMN IF NOT EXISTS opening_time TIME,
ADD COLUMN IF NOT EXISTS closing_time TIME,
ADD COLUMN IF NOT EXISTS foodbot_sync_enabled BOOLEAN DEFAULT true;

-- Default branches to open at 10:00 AM and close at 10:00 PM
UPDATE public.branches 
SET opening_time = '10:00:00', closing_time = '22:00:00'
WHERE opening_time IS NULL;

-- 4. Enable RLS and setup policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;

-- Admins can do everything on system_settings
CREATE POLICY "Admins have full access to system_settings"
    ON public.system_settings
    FOR ALL
    TO authenticated
    USING (public.is_jwt_admin())
    WITH CHECK (public.is_jwt_admin());

-- Cashiers can read system_settings
CREATE POLICY "Cashiers can read system_settings"
    ON public.system_settings
    FOR SELECT
    TO authenticated
    USING (public.has_jwt_role('CASHIER'));

-- Admins can do everything on sync_history
CREATE POLICY "Admins have full access to sync_history"
    ON public.sync_history
    FOR ALL
    TO authenticated
    USING (public.is_jwt_admin())
    WITH CHECK (public.is_jwt_admin());

-- Cashiers can read sync_history
CREATE POLICY "Cashiers can read sync_history"
    ON public.sync_history
    FOR SELECT
    TO authenticated
    USING (public.has_jwt_role('CASHIER'));

COMMIT;
