# Inventory Movements Module Tracking

## Objetivo

Implementar un sistema de inventario basado en eventos (Event Sourcing ligero), donde el historial de movimientos representa la fuente de verdad y el inventario actual se mantiene automáticamente como un estado derivado.

---

# Arquitectura

El módulo se divide en dos componentes principales:

## inventory_movements

Almacena todos los movimientos de inventario.

Cada registro representa un evento que modifica las existencias.

Los movimientos son inmutables.

Nunca deben actualizarse ni eliminarse.

---

## branch_inventory

Mantiene el inventario actual por producto y sucursal.

No debe modificarse directamente desde la aplicación.

Siempre se sincroniza automáticamente mediante funciones y triggers.

---

# Flujo

```text
INSERT inventory_movements
            │
            ▼
BEFORE INSERT
calculate_inventory_movement()
            │
            ▼
Calcula:

- previous_stock
- current_stock

Valida:

- inventario negativo

            │
            ▼
INSERT inventory_movements
            │
            ▼
AFTER INSERT
sync_branch_inventory()
            │
            ▼
UPSERT branch_inventory
```

---

# Funciones

## calculate_inventory_movement()

Responsabilidades:

- Obtener inventario actual.
- Calcular nuevo inventario.
- Validar inventario negativo.
- Completar previous_stock.
- Completar current_stock.

No modifica tablas.

Solo prepara el movimiento antes de insertarlo.

---

## sync_branch_inventory()

Responsabilidades:

- Mantener actualizado branch_inventory.
- Crear el registro automáticamente cuando no exista.
- Actualizar current_stock mediante UPSERT.

No realiza validaciones.

No calcula inventario.

---

# Decisiones de arquitectura

## Event Log

inventory_movements representa el historial oficial del inventario.

Nunca debe editarse.

Nunca debe eliminarse.

---

## Estado derivado

branch_inventory representa únicamente el estado actual.

Puede reconstruirse completamente a partir de inventory_movements.

---

## Auditoría

Cada movimiento almacena:

- previous_stock
- current_stock

Esto evita tener que recalcular el historial durante auditorías.

---

## Multiempresa

branch_inventory utiliza la restricción única:

(organization_id, branch_id, product_id)

Esto permite soportar múltiples organizaciones de manera consistente.

---

## Catálogos

movement_type_id utiliza catalog_values.

No se utilizaron ENUMs para facilitar la administración desde el ERP.

---

## reference_type

Se implementó como TEXT.

Representa el módulo que originó el movimiento.

Ejemplos:

- PURCHASE
- SALE
- TRANSFER
- WASTE
- ADJUSTMENT

---

# Archivos implementados

## Tablas

schema/tables/inventory/

- 002-branch_inventory.sql
- 003-inventory_movements.sql

---

## Índices

schema/indexes/inventory/

- 002-branch_inventory.sql
- 003-inventory_movements.sql

---

## Triggers

schema/triggers/inventory/

- 002-branch_inventory.sql
- 003-inventory_movements_before_insert.sql
- 004-inventory_movements_after_insert.sql

---

## Funciones

schema/functions/inventory/

- 001-calculate_inventory_movement.sql
- 002-sync_branch_inventory.sql

---

## Comentarios

schema/comments/inventory/

- 002-branch_inventory.sql
- 003-inventory_movements.sql

---

## Migraciones

schema/migrations/

- 001-update-branch_inventory-unique.sql

---

# Pendiente

- Implementar RLS.
- Integrar módulo de Compras.
- Integrar módulo de Ventas.
- Integrar módulo de Mermas.
- Integrar Transferencias.
- Agregar pruebas automatizadas.
- Crear seeds para INVENTORY_MOVEMENT_TYPE.

---

# Estado

✅ Completado

Fecha de finalización:

- Assignment 003
- Inventory Module