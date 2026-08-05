BEGIN;

CREATE OR REPLACE FUNCTION public.calculate_inventory_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_stock NUMERIC(12,2);
    v_new_stock NUMERIC(12,2);
BEGIN

    ------------------------------------------------------------------
    -- Obtener inventario actual
    ------------------------------------------------------------------

    SELECT bi.current_stock
      INTO v_current_stock
      FROM public.branch_inventory AS bi
     WHERE bi.organization_id = NEW.organization_id
       AND bi.branch_id = NEW.branch_id
       AND bi.product_id = NEW.product_id
     FOR UPDATE;

    IF NOT FOUND THEN
        v_current_stock := 0;
    END IF;

    ------------------------------------------------------------------
    -- Calcular inventario
    ------------------------------------------------------------------

    v_new_stock := v_current_stock + NEW.quantity;

    ------------------------------------------------------------------
    -- Validar inventario negativo
    ------------------------------------------------------------------

    -- Eliminada la validación de inventario negativo para permitir 
    -- sincronización sin stock inicial y evitar bloqueos en operaciones.

    ------------------------------------------------------------------
    -- Completar auditoría automáticamente
    ------------------------------------------------------------------

    NEW.previous_stock := v_current_stock;

    NEW.current_stock := v_new_stock;

    ------------------------------------------------------------------
    -- Continuar con el INSERT
    ------------------------------------------------------------------

    RETURN NEW;

END;
$$;

COMMIT;