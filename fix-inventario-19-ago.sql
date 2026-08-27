-- =========================================================================================
-- SCRIPT DE CORRECCIÓN: DEVOLUCIÓN DE INVENTARIO FANTASMA DEL 19 DE AGOSTO
-- =========================================================================================
-- Este script toma exactamente las cantidades que Foodbot restó el 19 de Agosto y 
-- crea un "Ajuste de Compensación" positivo el día de hoy para devolver esas piezas perdidas.

DO $$
DECLARE
    v_movement RECORD;
    v_adjustment_type_id UUID;
BEGIN
    -- 1. Obtener el ID del tipo de movimiento "Ajuste Positivo" o "Entrada por Ajuste"
    SELECT cv.id INTO v_adjustment_type_id
    FROM public.catalog_values cv
    JOIN public.catalog_types ct ON ct.id = cv.catalog_type_id
    WHERE ct.code = 'INVENTORY_MOVEMENT_TYPE' 
      AND cv.code IN ('ADJUSTMENT', 'INITIAL_STOCK')
    LIMIT 1;

    -- Si no existe, puedes cambiar el código arriba por el que usen para ajustes.
    
    -- 2. Recorrer todos los movimientos de Foodbot del 19 de Agosto
    FOR v_movement IN (
        SELECT 
            organization_id,
            branch_id,
            product_id,
            SUM(quantity) AS total_restado -- (Esto dará un número negativo, ej: -5)
        FROM 
            public.inventory_movements
        WHERE 
            notes LIKE '%2026-08-19%' 
            AND notes LIKE '%Foodbot%'
        GROUP BY 
            organization_id, branch_id, product_id
    )
    LOOP
        -- 3. Insertar el movimiento de compensación (Invertimos el signo para que sume)
        IF v_movement.total_restado < 0 THEN
            INSERT INTO public.inventory_movements (
                organization_id,
                branch_id,
                product_id,
                movement_type_id,
                quantity,
                notes
            ) VALUES (
                v_movement.organization_id,
                v_movement.branch_id,
                v_movement.product_id,
                v_adjustment_type_id,
                ABS(v_movement.total_restado), -- Vuelve el -5 en un +5
                'Compensación automática por doble resta del sincronizador de Foodbot del 19 de Agosto de 2026'
            );
        END IF;
    END LOOP;

END $$;
