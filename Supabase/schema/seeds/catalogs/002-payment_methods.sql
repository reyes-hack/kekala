-- =====================================================
-- SEED: payment_methods
-- Module: Catalogs
-- Description:
-- Initializes the payment methods catalog.
-- Safe to execute multiple times.
-- =====================================================

BEGIN;

WITH payment_method_catalog AS (

    SELECT id
    FROM public.catalog_types
    WHERE code = 'PAYMENT_METHOD'

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

    payment_method_catalog.id,

    v.code,

    v.name,

    v.description,

    v.sort_order,

    v.color,

    v.icon,

    v.metadata,

    TRUE,

    TRUE

FROM payment_method_catalog

CROSS JOIN (

VALUES

(
'CASH',
'Efectivo',
'Pago en efectivo.',
10,
'#4CAF50',
'cash',
'{}'::jsonb
),

(
'CARD',
'Tarjeta',
'Pago con tarjeta de crédito o débito.',
20,
'#2196F3',
'card',
'{}'::jsonb
),

(
'TRANSFER',
'Transferencia',
'Transferencia bancaria.',
30,
'#9C27B0',
'bank',
'{}'::jsonb
),

(
'DIGITAL_WALLET',
'Billetera Digital',
'Mercado Pago, CoDi u otras billeteras.',
40,
'#FF9800',
'wallet',
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