BEGIN;

CREATE OR REPLACE FUNCTION public.register_sale_inventory_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE

    v_sale RECORD;

    v_sale_movement_type_id UUID;

BEGIN

    ------------------------------------------------------------------
    -- Obtener información de la venta
    ------------------------------------------------------------------

    SELECT
        organization_id,
        branch_id
    INTO v_sale
    FROM public.sales
    WHERE id = NEW.sale_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'No existe la venta %.',
            NEW.sale_id;
    END IF;

    ------------------------------------------------------------------
    -- Obtener catálogo VENTA
    ------------------------------------------------------------------

    SELECT cv.id
    INTO v_sale_movement_type_id
    FROM public.catalog_values cv
    INNER JOIN public.catalog_types ct
        ON ct.id = cv.catalog_type_id
    WHERE ct.code = 'INVENTORY_MOVEMENT_TYPE'
      AND cv.code = 'SALE';

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'No existe el movimiento SALE dentro del catálogo INVENTORY_MOVEMENT_TYPE.';
    END IF;

    ------------------------------------------------------------------
    -- Registrar movimiento
    ------------------------------------------------------------------

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

        v_sale.organization_id,

        v_sale.branch_id,

        NEW.product_id,

        v_sale_movement_type_id,

        -NEW.quantity,

        'SALE',

        NEW.sale_id,

        'Movimiento generado automáticamente por una venta.'

    );

    RETURN NEW;

END;
$$;

COMMENT ON FUNCTION public.register_sale_inventory_movement IS
'Genera automáticamente un movimiento de inventario cuando se registra un producto vendido.';

COMMIT;