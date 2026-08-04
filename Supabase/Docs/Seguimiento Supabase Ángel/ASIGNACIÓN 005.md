# Sales Module Tracking

## Objetivo

Implementar el módulo de Punto de Venta (POS) del ERP, permitiendo registrar ventas locales, sus productos, los pagos realizados y la integración automática con el módulo de Inventario.

---

# Componentes implementados

## Sales

Tabla principal que representa una venta o ticket del Punto de Venta.

Se incorporó soporte para:

- Organización
- Sucursal
- Usuario que registra la venta
- Estado mediante catálogo
- Subtotal
- Descuentos
- Impuestos
- Total
- Metadata
- Auditoría

---

## Sale Items

Tabla que almacena el detalle de productos vendidos.

Cada registro conserva la información histórica de la venta:

- Cantidad
- Costo unitario
- Precio de venta
- Descuento
- Impuestos
- Subtotal
- Total

Se agregó una restricción única `(sale_id, product_id)` para evitar productos duplicados dentro del mismo ticket.

---

## Payments

Tabla para registrar uno o varios pagos por venta.

Permite soportar:

- Pagos mixtos
- Diferentes métodos de pago
- Referencias de pago
- Código de autorización
- Monto recibido
- Cambio
- Metadata

---

# Integración con Inventario

Se implementó la función:

`register_sale_inventory_movement()`

Cada vez que se registra un producto vendido (`sale_items`), se genera automáticamente un movimiento de inventario tipo **SALE**.

El flujo completo queda:

Sale Items

↓

register_sale_inventory_movement()

↓

Inventory Movements

↓

calculate_inventory_movement()

↓

sync_branch_inventory()

Con este diseño el módulo de Ventas no modifica directamente el inventario, sino que reutiliza completamente la lógica del módulo de Inventario.

---

# Catálogos implementados

## SALE_STATUS

- PENDING
- COMPLETED
- CANCELLED
- REFUNDED

## INVENTORY_MOVEMENT_TYPE

- INITIAL_STOCK
- PURCHASE
- SALE
- TRANSFER_IN
- TRANSFER_OUT
- ADJUSTMENT
- WASTE

---

# Mejoras respecto a la asignación

Se fortaleció el diseño original mediante:

- Arquitectura multiempresa.
- Integración con el sistema de catálogos.
- Históricos de costo y precio por producto vendido.
- Soporte para múltiples pagos por venta.
- Separación entre ventas e inventario mediante eventos y triggers.
- Uso de metadata para futuras integraciones.

---

# Archivos implementados

## Tables

- sales
- sale_items
- payments

## Indexes

- sales
- sale_items
- payments

## Triggers

- sales (updated_at)
- payments (updated_at)
- sale_items → inventory_movements

## Functions

- register_sale_inventory_movement()

## Catálogos

- SALE_STATUS
- INVENTORY_MOVEMENT_TYPE

---

# Estado

✅ Assignment 005 completada.

El módulo de Ventas queda integrado con Inventario y preparado para soportar operaciones de Punto de Venta (POS).