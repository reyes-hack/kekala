-- 018-payroll.sql

CREATE TABLE IF NOT EXISTS public.branch_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- e.g. "2026-08"
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    daily_rate NUMERIC NOT NULL DEFAULT 0,
    days_worked NUMERIC NOT NULL DEFAULT 0,
    bonuses NUMERIC NOT NULL DEFAULT 0,
    deductions NUMERIC NOT NULL DEFAULT 0,
    total_to_pay NUMERIC NOT NULL DEFAULT 0,
    bank_clabe TEXT,
    bank_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.branch_payroll ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Enable read access for all authenticated users"
    ON public.branch_payroll FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
    ON public.branch_payroll FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
    ON public.branch_payroll FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users"
    ON public.branch_payroll FOR DELETE
    USING (auth.role() = 'authenticated');
