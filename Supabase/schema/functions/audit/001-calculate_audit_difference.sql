BEGIN;

CREATE OR REPLACE FUNCTION public.calculate_audit_difference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS
$$
DECLARE

    v_branch_id UUID;

    v_expected_stock NUMERIC(12,2);

BEGIN

    ------------------------------------------------------------------
    -- Obtener sucursal de la sesión
    ------------------------------------------------------------------

    SELECT
        branch_id
    INTO v_branch_id
    FROM public.audit_sessions
    WHERE id = NEW.session_id;

    ------------------------------------------------------------------
    -- Obtener stock teórico
    ------------------------------------------------------------------

    SELECT
        current_stock
    INTO v_expected_stock
    FROM public.branch_inventory
    WHERE organization_id = NEW.organization_id
      AND branch_id = v_branch_id
      AND product_id = NEW.product_id;

    ------------------------------------------------------------------
    -- Si no existe inventario
    ------------------------------------------------------------------

    IF v_expected_stock IS NULL THEN

        v_expected_stock := 0;

    END IF;

    ------------------------------------------------------------------
    -- Completar automáticamente
    ------------------------------------------------------------------

    NEW.expected_stock := v_expected_stock;

    NEW.difference :=

        NEW.counted_stock

        -

        v_expected_stock;

    RETURN NEW;

END;
$$;

COMMENT ON FUNCTION public.calculate_audit_difference IS
'Calcula automáticamente el inventario teórico y la diferencia durante un conteo físico utilizando SECURITY DEFINER para evitar exponer branch_inventory al empleado.';

COMMIT;