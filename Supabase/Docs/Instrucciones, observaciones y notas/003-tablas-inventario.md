# ASIGNACIÓN 003: Control de Inventario y Lotes

Una vez que tengas listo el catálogo central de Productos (Asignación 002), necesitamos armar el sistema que le dará vida a la operación física: **El Inventario**. 

El objetivo es tener un rastreo inmutable de todo lo que entra y sale, saber qué caduca primero y cuánto stock exacto hay en cada sucursal de Kekala en tiempo real.

## Requerimientos y Diseño Sugerido

Para lograr esto con buenas prácticas, te propongo construir tres tablas esenciales en este módulo:

### 1. Tabla `inventory` (Existencias actuales por sucursal)
Esta tabla nos dirá rápidamente cuánto hay de X producto en Y sucursal.
- `id` (UUID - PK)
- `branch_id` (UUID - FK a `branches` - *que construiremos pronto, por ahora usa un placeholder o diséñala*)
- `product_id` (UUID - FK a `products`)
- `quantity` (Numeric/Int - Cantidad actual disponible)
- *Constraint:* Unique(`branch_id`, `product_id`) - Solo debe haber una fila por producto en cada sucursal.

### 2. Tabla `inventory_movements` (Historial inmutable)
Aquí se registra TODO. Nunca se hace UPDATE a un movimiento, solo INSERT. Si hay un error, se hace un movimiento compensatorio.
- `id` (UUID - PK)
- `branch_id` (UUID)
- `product_id` (UUID)
- `movement_type` (Enum o FK a catálogo: Ej. *ENTRADA_COMPRA*, *VENTA*, *MERMA*, *TRASPASO*)
- `quantity` (Numeric/Int - Positivo para entradas, Negativo para salidas)
- `reference_id` (UUID opcional - FK al ID de la Venta, Compra o Merma que originó el movimiento)
- `created_at` (TIMESTAMPTZ)
- `created_by` (UUID opcional - FK al usuario que lo registró)

### 3. Triggers en Base de Datos (Mágico 🪄)
Para asegurar la integridad de los datos y no depender del backend, te pido que crees una **Función y un Trigger** en Supabase:
- **`update_inventory_on_movement`**: Cada vez que se haga un `INSERT` en `inventory_movements`, el trigger debe automáticamente sumar o restar esa `quantity` en la tabla `inventory` correspondiente. Si el registro en `inventory` no existe, que lo cree (Upsert).

## ⚠️ REGLAS OBLIGATORIAS

Ya te la sabes, pero por protocolo:
1. **Respaldar en Git**: Guarda los scripts SQL (Tablas + Triggers) en tu estructura de `Supabase/schema/`.
2. **Commit y Push**: Sube tus cambios con `feat(db): modulo de inventario y triggers de actualizacion automatica`.
3. **Tracking**: Documenta en `Supabase/Docs/Seguimiento Supabase (Ángel)/` cómo diseñaste el Trigger por si en el backend necesitamos saber cómo se comporta.

Con esto ya podré empezar a crear las interfaces de Entradas de Almacén en el frontend.