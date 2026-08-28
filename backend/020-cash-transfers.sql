-- 020-cash-transfers.sql

-- Add manual_difference to cash_closures if it doesn't exist
ALTER TABLE public.cash_closures ADD COLUMN IF NOT EXISTS manual_difference NUMERIC NOT NULL DEFAULT 0;

-- Create cash_transfers table
CREATE TABLE IF NOT EXISTS public.cash_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    transfer_type TEXT NOT NULL CHECK (transfer_type IN ('BRANCH_TO_ADMIN', 'ADMIN_TO_BANK')),
    amount NUMERIC NOT NULL DEFAULT 0,
    transfer_date DATE NOT NULL,
    notes TEXT,
    registered_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cash_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for all users" ON public.cash_transfers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for all users" ON public.cash_transfers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for all users" ON public.cash_transfers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for all users" ON public.cash_transfers FOR DELETE USING (auth.role() = 'authenticated');
