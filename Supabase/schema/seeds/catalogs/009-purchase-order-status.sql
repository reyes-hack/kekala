BEGIN;

------------------------------------------------------------------
-- PURCHASE_ORDER_STATUS
------------------------------------------------------------------

INSERT INTO public.catalog_types (
    code,
    name,
    description
)
VALUES (
    'PURCHASE_ORDER_STATUS',
    'Estados de Orden de Compra',
    'Estados del ciclo de vida de una orden de compra.'
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

    ('PARTIALLY_RECEIVED','Parcialmente Recibida',20,'blue','partial'),

    ('RECEIVED','Recibida',30,'green','check'),

    ('CANCELLED','Cancelada',40,'red','cancel')

) AS v(
    code,
    name,
    sort_order,
    color,
    icon
)
WHERE ct.code='PURCHASE_ORDER_STATUS'
ON CONFLICT DO NOTHING;

COMMIT;