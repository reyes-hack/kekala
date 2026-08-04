# Purchasing Module Tracking

## Objetivo

Implementar el módulo de Compras del ERP para administrar proveedores, órdenes de compra y la recepción de mercancía, integrándolo automáticamente con el módulo de Inventario.

---

# Componentes implementados

## Suppliers

Catálogo maestro de proveedores del ERP.

Se incorporó soporte para:

- Organización
- Código único por organización
- Nombre comercial
- Razón social
- RFC
- Datos de contacto
- Dirección
- Metadata
- Estado activo
- Auditoría

---

## Purchase Orders

Tabla principal para administrar órdenes de compra.

Se implementó soporte para:

- Organización
- Sucursal
- Proveedor
- Usuario creador
- Estado mediante catálogo
- Fecha estimada de recepción
- Fecha real de recepción
- Subtotal
- Descuentos
- Impuestos
- Total
- Metadata
- Auditoría

---

## Purchase Order Items

Detalle de productos solicitados en cada orden de compra.

Cada registro almacena:

- Producto
- Cantidad solicitada
- Cantidad recibida
- Costo unitario
- Subtotal
- Impuestos
- Total

Se agregó una restricción única `(purchase_order_id, product_id)` para evitar productos duplicados dentro de una misma orden.

Además, el diseño soporta recepciones parciales mediante el campo `quantity_received`.

---

# Integración con Inventario

Se implementó la función:

`register_purchase_inventory_movements()`

Cuando una orden cambia al estado **RECEIVED**, la función genera automáticamente un movimiento de inventario por cada producto recibido.

El flujo queda de la siguiente forma:

Purchase Orders

↓

register_purchase_inventory_movements()

↓

Inventory Movements

↓

calculate_inventory_movement()

↓

sync_branch_inventory()

Con este diseño el módulo de Compras no modifica directamente el inventario, sino que reutiliza completamente la lógica central del módulo de Inventario.

---

# Catálogos implementados

## PURCHASE_ORDER_STATUS

- PENDING
- PARTIALLY_RECEIVED
- RECEIVED
- CANCELLED

---

# Mejoras respecto a la asignación

Se fortaleció el diseño original mediante:

- Arquitectura multiempresa.
- Integración con el sistema central de catálogos.
- Soporte para recepciones parciales.
- Separación entre Compras e Inventario mediante funciones y triggers.
- Uso de metadata para futuras integraciones.
- Códigos únicos por organización para proveedores y órdenes de compra.

---

# Archivos implementados

## Tables

- suppliers
- purchase_orders
- purchase_order_items

## Indexes

- suppliers
- purchase_orders
- purchase_order_items

## Triggers

- suppliers (updated_at)
- purchase_orders (updated_at)
- purchase_orders → inventory_movements

## Functions

- register_purchase_inventory_movements()

## Catálogos

- PURCHASE_ORDER_STATUS

---

# Estado

✅ Assignment 006 completada.

El módulo de Compras queda integrado con Inventario y preparado para administrar proveedores, órdenes de compra y recepciones de mercancía dentro del ERP.