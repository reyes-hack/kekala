BEGIN;

----------------------------------------------------------------------
-- Helper de seguridad para audit_counts
--
-- Verifica que la sesión de auditoría:
--
-- 1. Pertenezca al usuario autenticado.
-- 2. Pertenezca a la organización del JWT.
-- 3. Pertenezca a la sucursal del JWT.
--
-- SECURITY DEFINER permite consultar audit_sessions aunque el
-- CASHIER no tenga permiso SELECT sobre dicha tabla.
----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_insert_audit_count(
    p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.audit_sessions s
        WHERE s.id = p_session_id
          AND s.started_by = auth.uid()
          AND s.organization_id = public.jwt_organization_id()
          AND s.branch_id = public.jwt_branch_id()
    );
$$;


COMMENT ON FUNCTION public.can_insert_audit_count(UUID) IS
'Valida que un CASHIER solo pueda insertar conteos dentro de su propia sesión de auditoría, organización y sucursal.';


----------------------------------------------------------------------
-- Eliminar la política anterior demasiado amplia.
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "audit_counts_cashier_insert"
ON public.audit_counts;


----------------------------------------------------------------------
-- CASHIER:
-- Puede insertar únicamente dentro de su propia sesión de auditoría.
----------------------------------------------------------------------

CREATE POLICY "audit_counts_cashier_insert"
ON public.audit_counts
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_jwt_role('CASHIER')
    AND public.can_insert_audit_count(session_id)
);


----------------------------------------------------------------------
-- ADMIN:
-- Mantener el control administrativo existente.
----------------------------------------------------------------------

DROP POLICY IF EXISTS
    "audit_counts_admin_insert"
ON public.audit_counts;

CREATE POLICY "audit_counts_admin_insert"
ON public.audit_counts
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_jwt_admin()
);


----------------------------------------------------------------------
-- Seguridad adicional:
-- La organización enviada por el frontend tampoco puede ser falsa.
--
-- La validación de sesión ya comprueba la organización real.
-- El trigger existente sigue siendo responsable del cálculo
-- de expected_stock y difference.
----------------------------------------------------------------------

COMMIT;