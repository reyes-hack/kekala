# ASIGNACIÓN 005: Punto de Venta (Ventas Físicas y Pagos)

Ya que tenemos los productos y el inventario, es hora de darle salida a las paletas. Necesitamos crear el módulo de **Sales** para el Punto de Venta (POS) que usaremos en las sucursales, muy aparte de la integración que ya hicimos de Foodbot.

## Requerimientos y Diseño Sugerido

Basándome en tu entidad `Sales` del mapa de arquitectura, sugiero estas tres tablas principales:

### 1. Tabla `sales` (El Ticket/Orden)
- `id` (UUID - PK)
- `branch_id` (UUID - FK a `branches`)
- `created_by` (UUID - FK a `profiles`, quién cobró)
- `total_amount` (Numeric/Decimal)
- `status` (Enum/Varchar: ej. *COMPLETED*, *CANCELLED*)
- `created_at` (TIMESTAMPTZ)

### 2. Tabla `sale_items` (Detalle de los productos vendidos)
- `id` (UUID - PK)
- `sale_id` (UUID - FK a `sales`)
- `product_id` (UUID - FK a `products`)
- `quantity` (Int)
- `unit_price` (Numeric/Decimal - precio al momento de la venta)
- `subtotal` (Numeric/Decimal)

### 3. Tabla `payments` (Método de Pago)
- `id` (UUID - PK)
- `sale_id` (UUID - FK a `sales`)
- `payment_method_id` (UUID - FK a tu catálogo de métodos de pago)
- `amount` (Numeric/Decimal)
- *Nota: Separar pagos permite cobrar mitad en efectivo y mitad en tarjeta.*

### 4. TRIGGER OBLIGATORIO: Ventas -> Inventario
Aquí está la magia. Necesito que crees un **Trigger** para que cada vez que se haga un `INSERT` en `sale_items`, se dispare un `INSERT` automático en la tabla `inventory_movements` (Asignación 003) con el `movement_type` de "VENTA" y la `quantity` en **negativo** para descontar el stock.
El `reference_id` de ese movimiento debe ser el `sale_id`.

## REGLAS OBLIGATORIAS
1. **Git**: Scripts SQL en `Supabase/schema/tables/`.
2. **Commit y Push**: Sube tus cambios: `feat(db): modulo de ventas locales y trigger de descuento de inventario`.
3. **Tracking**: Documenta en tu carpeta de seguimiento cómo quedó armado el trigger para tenerlo en cuenta en el backend.
