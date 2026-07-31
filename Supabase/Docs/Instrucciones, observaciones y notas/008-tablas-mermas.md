# ASIGNACIÓN 008: Control de Mermas (Waste)

Para cerrar el círculo de la operación física, necesitamos poder registrar cuando el producto se daña, caduca o se tira a la basura. Este es el módulo de **Waste**.

## Requerimientos y Diseño Sugerido

### 1. Tabla `waste_records` (El reporte de merma)
- `id` (UUID - PK)
- `branch_id` (UUID - FK a `branches`)
- `reported_by` (UUID - FK a `profiles`)
- `waste_date` (Date/TIMESTAMPTZ)
- `reason` (VARCHAR/Enum - Ej. *CADUCIDAD*, *CAIDA*, *MALA_CALIDAD*)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)

### 2. Tabla `waste_items` (Detalle de productos mermados)
- `id` (UUID - PK)
- `waste_record_id` (UUID - FK a `waste_records`)
- `product_id` (UUID - FK a `products`)
- `quantity` (Int)
- `unit_cost_at_time` (Numeric/Decimal - para saber cuánto dinero perdimos basado en el costo del producto en ese momento)

### 3. TRIGGER OBLIGATORIO: Mermas -> Inventario
El último eslabón del inventario perfecto.
Necesitamos un **Trigger** que, al hacer un `INSERT` en `waste_items`, dispare un registro en `inventory_movements` con el `movement_type` configurado como "MERMA", y la `quantity` en **negativo** para descontarlo del stock de la sucursal.

## REGLAS OBLIGATORIAS
1. **Git**: Guarda tus scripts SQL en `Supabase/schema/tables/`.
2. **Commit y Push**: Sube tus cambios con: `feat(db): modulo de mermas y ultimo trigger de inventario`.
3. **Tracking**: Cuando termines todo este bloque, deja documentado en `Supabase/Docs/Seguimiento Supabase (Ángel)/` que ya completaste hasta la asignación 008, así sabemos que el core operativo de la Base de Datos está completo.
