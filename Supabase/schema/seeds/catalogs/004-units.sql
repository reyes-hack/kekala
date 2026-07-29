-- =====================================================
-- SEED: units
-- Module: Catalogs
-- Description:
-- Initializes the measurement units catalog.
-- Safe to execute multiple times.
-- =====================================================

BEGIN;

WITH unit_catalog AS (

    SELECT id
    FROM public.catalog_types
    WHERE code = 'UNIT'

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

    unit_catalog.id,

    v.code,
    v.name,
    v.description,
    v.sort_order,
    v.color,
    v.icon,
    v.metadata,

    TRUE,
    TRUE

FROM unit_catalog

CROSS JOIN (

VALUES

('UNIT',        'Pieza',       'Unidad individual.',                  10, '#607D8B', 'unit',        '{}'::jsonb),
('BOX',         'Caja',        'Caja o paquete.',                     20, '#795548', 'box',         '{}'::jsonb),
('KILOGRAM',    'Kilogramo',   'Unidad de peso en kilogramos.',       30, '#4CAF50', 'scale',       '{}'::jsonb),
('GRAM',        'Gramo',       'Unidad de peso en gramos.',           40, '#8BC34A', 'weight',      '{}'::jsonb),
('LITER',       'Litro',       'Unidad de volumen.',                  50, '#2196F3', 'liquid',      '{}'::jsonb),
('MILLILITER',  'Mililitro',   'Unidad de volumen en mililitros.',    60, '#03A9F4', 'drop',        '{}'::jsonb)

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