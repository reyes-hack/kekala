BEGIN;

------------------------------------------------------------------
-- WASTE_STATUS
------------------------------------------------------------------

INSERT INTO public.catalog_types (
    code,
    name,
    description
)
VALUES (
    'WASTE_STATUS',
    'Estados de Merma',
    'Estados del ciclo de vida de un reporte de merma.'
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

    ('APPROVED','Aprobada',20,'green','check'),

    ('CANCELLED','Cancelada',30,'red','cancel')

) AS v(
    code,
    name,
    sort_order,
    color,
    icon
)
WHERE ct.code='WASTE_STATUS'
ON CONFLICT DO NOTHING;

------------------------------------------------------------------
-- WASTE_REASON
------------------------------------------------------------------

INSERT INTO public.catalog_types (
    code,
    name,
    description
)
VALUES (
    'WASTE_REASON',
    'Motivos de Merma',
    'Motivos por los cuales un producto fue dado de baja del inventario.'
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

    ('EXPIRATION','Caducidad',10,'orange','schedule'),

    ('DAMAGE','Daño Físico',20,'red','broken_image'),

    ('POOR_QUALITY','Mala Calidad',30,'yellow','warning'),

    ('CONTAMINATION','Contaminación',40,'purple','science'),

    ('THEFT','Robo',50,'black','security'),

    ('ADJUSTMENT','Ajuste de Inventario',60,'blue','inventory'),

    ('OTHER','Otro',70,'gray','category')

) AS v(
    code,
    name,
    sort_order,
    color,
    icon
)
WHERE ct.code='WASTE_REASON'
ON CONFLICT DO NOTHING;

COMMIT;