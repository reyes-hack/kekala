BEGIN;

CREATE TABLE IF NOT EXISTS public.auth_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email TEXT,
    event_type TEXT NOT NULL,
    ip_address TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Solo Admin puede ver esto, o la base de datos (service_role)
ALTER TABLE public.auth_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins pueden ver logs de auditoria" 
ON public.auth_audit_logs FOR SELECT 
TO authenticated 
USING (public.has_jwt_role('ADMIN'));

COMMIT;
