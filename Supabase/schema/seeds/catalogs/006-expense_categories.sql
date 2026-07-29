-- =====================================================
-- SEED: expense_categories
-- Module: Catalogs
-- Description:
-- Initializes the expense categories catalog.
-- Safe to execute multiple times.
-- =====================================================

BEGIN;

WITH expense_category_catalog AS (

    SELECT id
    FROM public.catalog_types
    WHERE code = 'EXPENSE_CATEGORY'

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

    expense_category_catalog.id,

    v.code,
    v.name,
    v.description,
    v.sort_order,
    v.color,
    v.icon,
    v.metadata,

    TRUE,
    TRUE

FROM expense_category_catalog

CROSS JOIN (

VALUES

(
'OPERATING',
'Operación',
'Gastos operativos generales.',
10,
'blue',
'operation',
'{}'::jsonb
),

(
'SUPPLIES',
'Insumos',
'Compra de insumos y materiales.',
20,
'green',
'supplies',
'{}'::jsonb
),

(
'SERVICES',
'Servicios',
'Pago de servicios contratados.',
30,
'orange',
'services',
'{}'::jsonb
),

(
'MAINTENANCE',
'Mantenimiento',
'Mantenimiento preventivo y correctivo.',
40,
'yellow',
'maintenance',
'{}'::jsonb
),

(
'PAYROLL',
'Nómina',
'Sueldos y prestaciones.',
50,
'purple',
'payroll',
'{}'::jsonb
),

(
'OTHER',
'Otros',
'Gastos no clasificados.',
60,
'gray',
'other',
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