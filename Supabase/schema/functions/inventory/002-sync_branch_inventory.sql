BEGIN;

CREATE OR REPLACE FUNCTION public.sync_branch_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    ------------------------------------------------------------------
    -- Sincronizar inventario actual
    ------------------------------------------------------------------

    INSERT INTO public.branch_inventory (
        organization_id,
        branch_id,
        product_id,
        current_stock,
        minimum_stock,
        maximum_stock,
        is_active
    )
    VALUES (
        NEW.organization_id,
        NEW.branch_id,
        NEW.product_id,
        NEW.current_stock,
        0,
        0,
        TRUE
    )
    ON CONFLICT (
        organization_id,
        branch_id,
        product_id
    )
    DO UPDATE
    SET
        current_stock = EXCLUDED.current_stock,
        updated_at = NOW();

    RETURN NEW;

END;
$$;

COMMIT;