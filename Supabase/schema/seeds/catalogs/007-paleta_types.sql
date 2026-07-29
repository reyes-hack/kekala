-- =====================================================
-- SEED: paleta_types
-- Module: Catalogs
-- Description:
-- Initializes the paleta types catalog.
-- Safe to execute multiple times.
-- =====================================================

BEGIN;

WITH paleta_type_catalog AS (

    SELECT id
    FROM public.catalog_types
    WHERE code = 'PALETA_TYPE'

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

    paleta_type_catalog.id,

    v.code,
    v.name,
    v.description,
    v.sort_order,
    v.color,
    v.icon,
    v.metadata,

    TRUE,
    TRUE

FROM paleta_type_catalog

CROSS JOIN (

VALUES

(
'ORIGINAL',
'Original',
'Presentación original de la paleta.',
10,
'blue',
'original',
'{}'::jsonb
),

(
'FLAT',
'Flat',
'Presentación plana de la paleta.',
20,
'green',
'flat',
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