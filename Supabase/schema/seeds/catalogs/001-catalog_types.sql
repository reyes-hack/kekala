-- =====================================================
-- SEED: catalog_types
-- Module: Catalogs
-- Description:
-- Initializes the catalog types used by the ERP.
-- Safe to execute multiple times.
-- =====================================================

BEGIN;

INSERT INTO public.catalog_types (
    code,
    name,
    description,
    is_system,
    is_active
)
VALUES

(
    'PAYMENT_METHOD',
    'Métodos de Pago',
    'Catálogo de métodos de pago.',
    TRUE,
    TRUE
),

(
    'SHIFT',
    'Turnos',
    'Catálogo de turnos operativos.',
    TRUE,
    TRUE
),

(
    'UNIT',
    'Unidades',
    'Catálogo de unidades de medida.',
    TRUE,
    TRUE
),

(
    'PRODUCT_CATEGORY',
    'Categorías de Producto',
    'Clasificación de productos.',
    TRUE,
    TRUE
),

(
    'EXPENSE_CATEGORY',
    'Categorías de Gasto',
    'Clasificación de gastos.',
    TRUE,
    TRUE
),

(
    'PALETA_TYPE',
    'Tipos de Paleta',
    'Clasificación de paletas.',
    TRUE,
    TRUE
),

(
    'FLAVOR',
    'Sabores',
    'Catálogo de sabores.',
    TRUE,
    TRUE
)

ON CONFLICT (code)
DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

COMMIT;