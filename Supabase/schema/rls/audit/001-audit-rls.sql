BEGIN;

------------------------------------------------------------------
-- AUDIT SESSIONS
------------------------------------------------------------------

ALTER TABLE public.audit_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_sessions_employee_insert
ON public.audit_sessions;

CREATE POLICY audit_sessions_employee_insert
ON public.audit_sessions
FOR INSERT
WITH CHECK (

    has_jwt_role('EMPLOYEE')

    OR

    is_jwt_admin()

);

DROP POLICY IF EXISTS audit_sessions_employee_update
ON public.audit_sessions;

CREATE POLICY audit_sessions_employee_update
ON public.audit_sessions
FOR UPDATE
USING (

    started_by = auth.uid()

    OR

    is_jwt_admin()

)
WITH CHECK (

    started_by = auth.uid()

    OR

    is_jwt_admin()

);

DROP POLICY IF EXISTS audit_sessions_admin_select
ON public.audit_sessions;

CREATE POLICY audit_sessions_admin_select
ON public.audit_sessions
FOR SELECT
USING (

    is_jwt_admin()

);

------------------------------------------------------------------
-- AUDIT COUNTS
------------------------------------------------------------------

ALTER TABLE public.audit_counts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_counts_employee_insert
ON public.audit_counts;

CREATE POLICY audit_counts_employee_insert
ON public.audit_counts
FOR INSERT
WITH CHECK (

    has_jwt_role('EMPLOYEE')

    OR

    is_jwt_admin()

);

DROP POLICY IF EXISTS audit_counts_admin_select
ON public.audit_counts;

CREATE POLICY audit_counts_admin_select
ON public.audit_counts
FOR SELECT
USING (

    is_jwt_admin()

);

COMMIT;