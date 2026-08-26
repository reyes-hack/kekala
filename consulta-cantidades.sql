-- ==============================================================================
-- Consulta: Cantidades vendidas totales por producto (Todas las sucursales)
-- ==============================================================================

-- 1. SUMA GLOBAL: Total de cada producto vendido sumando todas las sucursales
SELECT 
    source_product_name AS producto,
    SUM(quantity_sold) AS cantidad_total_vendida
FROM 
    public.external_sales_report_items
GROUP BY 
    source_product_name
ORDER BY 
    cantidad_total_vendida DESC;

-- ==============================================================================

-- 2. DESGLOSE POR SUCURSAL: Si deseas ver cuánto vendió CADA sucursal por producto
SELECT 
    b.name AS sucursal,
    i.source_product_name AS producto,
    SUM(i.quantity_sold) AS cantidad_total_vendida
FROM 
    public.external_sales_report_items i
JOIN 
    public.external_sales_reports r ON r.id = i.report_id
JOIN 
    public.branches b ON b.id = r.branch_id
GROUP BY 
    b.name, 
    i.source_product_name
ORDER BY 
    b.name ASC, 
    cantidad_total_vendida DESC;
