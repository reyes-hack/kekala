-- =====================================================
-- SEED: shifts
-- Module: Catalogs
-- Description:
-- Initializes the operational shift catalog.
-- Safe to execute multiple times.
-- =====================================================

BEGIN;

WITH shift_catalog AS (

    SELECT id
    FROM public.catalog_types
    WHERE code = 'SHIFT'

)

INSERT INTO public.catalog_values (

    catalog_type_id,

    code,

    name,

    description,

    sort_order,

    color,

    icon,

    metadata,

    is_system,

    is_active

)

SELECT

    shift_catalog.id,

    v.code,

    v.name,

    v.description,

    v.sort_order,

    v.color,

    v.icon,

    v.metadata,

    TRUE,

    TRUE

FROM shift_catalog

CROSS JOIN (

VALUES

(
'MORNING',
'Matutino',
'Turno matutino.',
10,
'#4CAF50',
'sunrise',
'{}'::jsonb
),

(
'AFTERNOON',
'Vespertino',
'Turno vespertino.',
20,
'#FF9800',
'sunset',
'{}'::jsonb
),

(
'NIGHT',
'Nocturno',
'Turno nocturno.',
30,
'#3F51B5',
'moon',
'{}'::jsonb
)

) AS v(

code,
name,
description,
sort_order,
color,
icon,
metadata

)

ON CONFLICT (catalog_type_id, code)

DO UPDATE

SET

    name = EXCLUDED.name,

    description = EXCLUDED.description,

    sort_order = EXCLUDED.sort_order,

    color = EXCLUDED.color,

    icon = EXCLUDED.icon,

    metadata = EXCLUDED.metadata;

COMMIT;