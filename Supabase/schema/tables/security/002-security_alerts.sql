BEGIN;

CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'MEDIUM',
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Solo Admin puede ver las alertas de su organización
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins ven alertas de su org" 
ON public.security_alerts FOR SELECT 
TO authenticated 
USING (
    public.has_jwt_role('ADMIN') AND 
    public.is_same_organization(organization_id)
);

CREATE POLICY "Admins pueden resolver alertas" 
ON public.security_alerts FOR UPDATE 
TO authenticated 
USING (
    public.has_jwt_role('ADMIN') AND 
    public.is_same_organization(organization_id)
)
WITH CHECK (
    public.has_jwt_role('ADMIN') AND 
    public.is_same_organization(organization_id)
);

COMMIT;
