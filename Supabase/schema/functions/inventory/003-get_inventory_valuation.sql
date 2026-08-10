-- =====================================================
-- FUNCTION: get_inventory_valuation
-- Module: Inventory
-- Description:
-- Calculates the monetary value of the inventory
-- for a specific branch, detailed by product.
-- Uses SECURITY INVOKER so RLS policies are respected.
-- =====================================================

DROP FUNCTION IF EXISTS public.get_inventory_valuation(UUID);

CREATE OR REPLACE FUNCTION public.get_inventory_valuation(p_branch_id UUID)
RETURNS TABLE (
    category_name TEXT,
    product_name TEXT,
    unit_name TEXT,
    current_stock NUMERIC,
    cost_price NUMERIC,
    total_value NUMERIC
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT 
        c.name AS category_name,
        p.name AS product_name,
        CASE 
            WHEN u.name ILIKE '%mili%' THEN 'L'
            WHEN u.name ILIKE '%gram%' THEN 'kg'
            ELSE u.name
        END AS unit_name,
        CASE 
            WHEN u.name ILIKE '%mili%' OR u.name ILIKE '%gram%' THEN (bi.current_stock / 1000.0)
            ELSE bi.current_stock
        END AS current_stock,
        
        (
            COALESCE(
                CASE 
                    WHEN p.box_price > 0 AND p.items_per_box > 0 THEN (p.box_price / p.items_per_box)
                    ELSE p.cost_price 
                END, 
                0
            ) * 
            CASE 
                WHEN u.name ILIKE '%mili%' OR u.name ILIKE '%gram%' THEN 1000.0
                ELSE 1.0
            END
        ) AS cost_price,

        (
            bi.current_stock * COALESCE(
                CASE 
                    WHEN p.box_price > 0 AND p.items_per_box > 0 THEN (p.box_price / p.items_per_box)
                    ELSE p.cost_price 
                END, 
                0
            )
        ) AS total_value
    FROM public.branch_inventory bi
    JOIN public.products p ON p.id = bi.product_id
    JOIN public.catalog_values c ON c.id = p.category_id
    JOIN public.catalog_values u ON u.id = p.unit_id
    WHERE bi.branch_id = p_branch_id
      AND bi.is_active = TRUE
      AND p.is_active = TRUE
    ORDER BY c.name ASC, total_value DESC;
$$;

COMMENT ON FUNCTION public.get_inventory_valuation IS
'Calcula la valorización del inventario de una sucursal con desglose por cada producto.';

-- Dar permisos de ejecución a los roles autenticados
GRANT EXECUTE ON FUNCTION public.get_inventory_valuation(UUID) TO authenticated;
