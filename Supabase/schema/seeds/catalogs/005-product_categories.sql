-- =====================================================
-- SEED: product_categories
-- Module: Catalogs
-- Description:
-- Initializes the product categories catalog.
-- Safe to execute multiple times.
-- =====================================================

BEGIN;

WITH product_category_catalog AS (

    SELECT id
    FROM public.catalog_types
    WHERE code = 'PRODUCT_CATEGORY'

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

    product_category_catalog.id,

    v.code,
    v.name,
    v.description,
    v.sort_order,
    v.color,
    v.icon,
    v.metadata,

    TRUE,
    TRUE

FROM product_category_catalog

CROSS JOIN (

VALUES

(
'PALETA',
'Paleta',
'Productos tipo paleta.',
10,
'blue',
'paleta',
'{}'::jsonb
),

(
'HELADO',
'Helado',
'Productos tipo helado.',
20,
'green',
'icecream',
'{}'::jsonb
),

(
'BEBIDA',
'Bebida',
'Bebidas frías o calientes.',
30,
'orange',
'drink',
'{}'::jsonb
),

(
'COMPLEMENT',
'Complemento',
'Productos complementarios o adicionales.',
40,
'gray',
'package',
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