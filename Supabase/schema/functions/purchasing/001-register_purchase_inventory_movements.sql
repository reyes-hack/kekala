BEGIN;

CREATE OR REPLACE FUNCTION public.register_purchase_inventory_movements()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE

    v_received_status_id UUID;
    v_purchase_movement_type_id UUID;

    v_item RECORD;

BEGIN

    ------------------------------------------------------------------
    -- Buscar estado RECEIVED
    ------------------------------------------------------------------

    SELECT cv.id
    INTO v_received_status_id
    FROM public.catalog_values cv
    INNER JOIN public.catalog_types ct
        ON ct.id = cv.catalog_type_id
    WHERE ct.code = 'PURCHASE_ORDER_STATUS'
      AND cv.code = 'RECEIVED';

    ------------------------------------------------------------------
    -- Solo ejecutar cuando cambia a RECEIVED
    ------------------------------------------------------------------

    IF NEW.status_id <> v_received_status_id
       OR OLD.status_id = NEW.status_id THEN

        RETURN NEW;

    END IF;

    ------------------------------------------------------------------
    -- Buscar tipo PURCHASE
    ------------------------------------------------------------------

    SELECT cv.id
    INTO v_purchase_movement_type_id
    FROM public.catalog_values cv
    INNER JOIN public.catalog_types ct
        ON ct.id = cv.catalog_type_id
    WHERE ct.code = 'INVENTORY_MOVEMENT_TYPE'
      AND cv.code = 'PURCHASE';

    ------------------------------------------------------------------
    -- Recorrer productos
    ------------------------------------------------------------------

    FOR v_item IN

        SELECT *
        FROM public.purchase_order_items
        WHERE purchase_order_id = NEW.id

    LOOP

        INSERT INTO public.inventory_movements (

            organization_id,
            branch_id,
            product_id,
            movement_type_id,
            quantity,
            reference_type,
            reference_id,
            notes

        )
        VALUES (

            NEW.organization_id,
            NEW.branch_id,
            v_item.product_id,
            v_purchase_movement_type_id,
            v_item.quantity_received,
            'PURCHASE',
            NEW.id,
            'Movimiento generado automáticamente por recepción de compra.'

        );

    END LOOP;

    ------------------------------------------------------------------
    -- Guardar fecha de recepción
    ------------------------------------------------------------------

    NEW.received_date := CURRENT_DATE;

    RETURN NEW;

END;
$$;

COMMENT ON FUNCTION public.register_purchase_inventory_movements IS
'Genera automáticamente movimientos de inventario cuando una orden cambia al estado RECEIVED.';

COMMIT;