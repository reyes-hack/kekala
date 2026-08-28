-- 019-fix-fixed-costs.sql
ALTER TABLE public.branch_fixed_costs ADD COLUMN IF NOT EXISTS month_year TEXT;
