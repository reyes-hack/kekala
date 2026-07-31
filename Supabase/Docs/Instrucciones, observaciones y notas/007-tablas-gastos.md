# ASIGNACIÓN 007: Gastos Operativos (Expenses)

Basado en tu documento de `004-erp-entity-map.md`, procedemos a estructurar el módulo de **Expenses**.

## Requerimientos y Diseño Sugerido

Este módulo es relativamente sencillo porque no toca inventario, pero es vital para el Estado de Resultados. Ya creaste los catálogos de `Expense Categories` (Limpieza, Papelería, etc.), ahora necesitamos unirlos.

### 1. Tabla `expenses` (Gastos)
- `id` (UUID - PK)
- `branch_id` (UUID - FK a `branches`)
- `category_id` (UUID - FK a catálogo de categorías de gasto)
- `establishment_id` (UUID - FK a catálogo de establecimientos, ej: Costco, Office Depot. *Si no existe la tabla de catálogos de establecimiento, por favor créala.*)
- `payment_method_id` (UUID - FK a catálogo de métodos de pago, para saber de dónde salió el dinero)
- `amount` (Numeric/Decimal)
- `description` (TEXT)
- `expense_date` (Date/DateISO)
- `created_by` (UUID - FK a `profiles`)
- `created_at` (TIMESTAMPTZ)

### 2. Tabla `expense_attachments` (Comprobantes / Tickets)
A menudo los gerentes le toman foto al ticket del Oxxo o la factura de Office Depot. Necesitamos poder vincular múltiples archivos a un solo gasto.
- `id` (UUID - PK)
- `expense_id` (UUID - FK a `expenses`)
- `file_url` (TEXT - URL o path del archivo subido al Supabase Storage)
- `file_type` (VARCHAR - Ej. *image/jpeg*, *application/pdf*)
- `created_at` (TIMESTAMPTZ)

## REGLAS OBLIGATORIAS
1. **Git**: Scripts SQL en `Supabase/schema/tables/`.
2. **Commit y Push**: Sube tus cambios: `feat(db): modulo de gastos y comprobantes`.
3. **Storage**: Si puedes, ve dejando configurado o contemplado el Bucket de Supabase Storage para alojar estas imágenes de comprobantes. Repórtalo en tu Tracking.
