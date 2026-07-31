# ASIGNACIÓN 006: Compras y Proveedores (Purchasing)

Para que haya inventario que vender, primero hay que comprarlo. Siguiendo tu mapa de arquitectura, vamos con el módulo de **Purchasing**.

## Requerimientos y Diseño Sugerido

### 1. Tabla `suppliers` (Proveedores)
- `id` (UUID - PK)
- `name` (VARCHAR) - Ej. *Kekala Matriz*, *Sabritas*, *Coca Cola*.
- `contact_info` (TEXT)
- `is_active` (Boolean)

### 2. Tabla `purchase_orders` (Órdenes de Compra)
- `id` (UUID - PK)
- `branch_id` (UUID - FK a `branches`, quién recibe)
- `supplier_id` (UUID - FK a `suppliers`)
- `created_by` (UUID - FK a `profiles`)
- `status` (Enum/Varchar: ej. *PENDING*, *RECEIVED*, *CANCELLED*)
- `total_cost` (Numeric/Decimal)
- `created_at` (TIMESTAMPTZ)

### 3. Tabla `purchase_order_items` (Detalle de la compra)
- `id` (UUID - PK)
- `purchase_order_id` (UUID - FK a `purchase_orders`)
- `product_id` (UUID - FK a `products`)
- `quantity` (Int)
- `unit_cost` (Numeric/Decimal)
- `subtotal` (Numeric/Decimal)

### 4. TRIGGER OBLIGATORIO: Compras -> Inventario
Al igual que en ventas, queremos automatizar el flujo:
Crea un **Trigger** para que, cuando el `status` de una orden en `purchase_orders` cambie a **RECEIVED** (Recibida), se dispare un `INSERT` por cada item de esa orden hacia la tabla `inventory_movements`.
El `movement_type` debe ser "COMPRA" o "ENTRADA", y la `quantity` debe ser **positiva** para sumar el stock.

## REGLAS OBLIGATORIAS
1. **Git**: Scripts SQL en `Supabase/schema/tables/`.
2. **Commit y Push**: Sube tus cambios: `feat(db): modulo de compras y proveedores con trigger de recepcion`.
3. **Tracking**: Breve nota en tu carpeta de seguimiento sobre si encontraste algún reto con el trigger de actualización.
