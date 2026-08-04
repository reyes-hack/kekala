BEGIN;

CREATE OR REPLACE FUNCTION public.register_waste_inventory_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE

    v_record RECORD;

    v_waste_movement_type_id UUID;

BEGIN

    ------------------------------------------------------------------
    -- Obtener información del reporte
    ------------------------------------------------------------------

    SELECT *
    INTO v_record
    FROM public.waste_records
    WHERE id = NEW.waste_record_id;

    ------------------------------------------------------------------
    -- Obtener tipo MERMA
    ------------------------------------------------------------------

    SELECT cv.id
    INTO v_waste_movement_type_id
    FROM public.catalog_values cv
    INNER JOIN public.catalog_types ct
        ON ct.id = cv.catalog_type_id
    WHERE ct.code = 'INVENTORY_MOVEMENT_TYPE'
      AND cv.code = 'WASTE';

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

        v_record.organization_id,
        v_record.branch_id,
        NEW.product_id,
        v_waste_movement_type_id,
        -NEW.quantity,
        'WASTE',
        NEW.waste_record_id,
        'Movimiento generado automáticamente por registro de merma.'

    );

    RETURN NEW;

END;
$$;

COMMENT ON FUNCTION public.register_waste_inventory_movement IS
'Genera automáticamente movimientos de inventario cuando se registra una merma.';

COMMIT;