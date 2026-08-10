BEGIN;

CREATE OR REPLACE FUNCTION public.get_pos_products()
RETURNS TABLE (
    id UUID,
    product_code TEXT,
    name TEXT,
    description TEXT,
    category_id UUID,
    unit_id UUID,
    is_active BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS
$$
BEGIN

    -- Solo usuarios autenticados.
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'AUTHENTICATION_REQUIRED';
    END IF;

    -- Solo ADMIN o CASHIER pueden consultar el catálogo POS.
    IF NOT (
        public.is_jwt_admin()
        OR public.has_jwt_role('CASHIER')
    ) THEN
        RAISE EXCEPTION 'INSUFFICIENT_ROLE';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.product_code,
        p.name,
        p.description,
        p.category_id,
        p.unit_id,
        p.is_active
    FROM public.products p
    WHERE p.is_active = true
    ORDER BY p.name;

END;
$$;

COMMENT ON FUNCTION public.get_pos_products() IS
'Devuelve el catálogo mínimo necesario para POS sin exponer cost_price ni box_price. Accesible únicamente para ADMIN y CASHIER autenticados.';

REVOKE ALL
ON FUNCTION public.get_pos_products()
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.get_pos_products()
TO authenticated;

COMMIT;