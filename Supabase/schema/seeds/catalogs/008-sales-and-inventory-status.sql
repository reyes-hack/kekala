BEGIN;

------------------------------------------------------------------
-- SALE_STATUS
------------------------------------------------------------------

INSERT INTO public.catalog_types (
    code,
    name,
    description
)
VALUES (
    'SALE_STATUS',
    'Estados de Venta',
    'Estados del ciclo de vida de una venta.'
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.catalog_values (
    catalog_type_id,
    code,
    name,
    sort_order,
    color,
    icon,
    is_active
)
SELECT
    ct.id,
    v.code,
    v.name,
    v.sort_order,
    v.color,
    v.icon,
    TRUE
FROM public.catalog_types ct
CROSS JOIN (

    VALUES

    ('PENDING','Pendiente',10,'orange','pending'),

    ('COMPLETED','Completada',20,'green','check'),

    ('CANCELLED','Cancelada',30,'red','cancel'),

    ('REFUNDED','Reembolsada',40,'blue','refund')

) AS v(
    code,
    name,
    sort_order,
    color,
    icon
)
WHERE ct.code='SALE_STATUS'
ON CONFLICT DO NOTHING;

------------------------------------------------------------------
-- INVENTORY_MOVEMENT_TYPE
------------------------------------------------------------------

INSERT INTO public.catalog_types (
    code,
    name,
    description
)
VALUES (
    'INVENTORY_MOVEMENT_TYPE',
    'Tipos de Movimiento de Inventario',
    'Clasificación de todos los movimientos de inventario.'
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.catalog_values (
    catalog_type_id,
    code,
    name,
    sort_order,
    color,
    icon,
    is_active
)
SELECT
    ct.id,
    v.code,
    v.name,
    v.sort_order,
    v.color,
    v.icon,
    TRUE
FROM public.catalog_types ct
CROSS JOIN (

    VALUES

    ('INITIAL_STOCK','Inventario Inicial',10,'gray','inventory'),

    ('PURCHASE','Compra',20,'green','shopping'),

    ('SALE','Venta',30,'blue','sell'),

    ('TRANSFER_IN','Entrada por Traspaso',40,'teal','arrow_down'),

    ('TRANSFER_OUT','Salida por Traspaso',50,'orange','arrow_up'),

    ('ADJUSTMENT','Ajuste',60,'purple','edit'),

    ('WASTE','Merma',70,'red','delete')

) AS v(
    code,
    name,
    sort_order,
    color,
    icon
)
WHERE ct.code='INVENTORY_MOVEMENT_TYPE'
ON CONFLICT DO NOTHING;

COMMIT;