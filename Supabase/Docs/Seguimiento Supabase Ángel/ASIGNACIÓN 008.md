# Waste Module Tracking

## Objetivo

Implementar el módulo de Mermas del ERP para registrar pérdidas de inventario, documentar sus causas y mantener sincronizadas las existencias mediante el sistema central de movimientos de inventario.

---

# Componentes implementados

## Waste Records

Tabla principal para registrar reportes de merma.

Se incorporó soporte para:

- Organización
- Sucursal
- Folio de merma
- Usuario que reporta
- Estado mediante catálogo
- Motivo mediante catálogo
- Fecha de la merma
- Costo total estimado
- Observaciones
- Metadata
- Auditoría

---

## Waste Items

Detalle de productos incluidos en un reporte de merma.

Cada registro almacena:

- Producto
- Cantidad afectada
- Costo unitario al momento de la merma
- Costo total perdido
- Auditoría

Se agregó una restricción única `(waste_record_id, product_id)` para evitar productos duplicados dentro del mismo reporte.

---

# Integración con Inventario

Se implementó la función:

`register_waste_inventory_movement()`

Cada vez que se registra un producto en `waste_items`, se genera automáticamente un movimiento de inventario tipo **WASTE** con cantidad negativa.

El flujo queda de la siguiente forma:

Waste Items

↓

register_waste_inventory_movement()

↓

Inventory Movements

↓

calculate_inventory_movement()

↓

sync_branch_inventory()

Con este diseño el módulo de Mermas reutiliza completamente la lógica central del módulo de Inventario y no modifica existencias directamente.

---

# Catálogos implementados

## WASTE_STATUS

- PENDING
- APPROVED
- CANCELLED

## WASTE_REASON

- EXPIRATION
- DAMAGE
- POOR_QUALITY
- CONTAMINATION
- THEFT
- ADJUSTMENT
- OTHER

---

# Mejoras respecto a la asignación

Se fortaleció el diseño original mediante:

- Arquitectura multiempresa.
- Integración con el sistema central de catálogos.
- Separación entre Mermas e Inventario mediante funciones y triggers.
- Registro del costo unitario y costo total perdido.
- Uso de metadata para futuras extensiones.

---

# Archivos implementados

## Tables

- waste_records
- waste_items

## Indexes

- waste_records
- waste_items

## Triggers

- waste_records (updated_at)
- waste_items → inventory_movements

## Functions

- register_waste_inventory_movement()

## Catálogos

- WASTE_STATUS
- WASTE_REASON

---

# Estado

✅ Assignment 008 completada.

El módulo de Mermas queda integrado con Inventario y completa el ciclo operativo del ERP.