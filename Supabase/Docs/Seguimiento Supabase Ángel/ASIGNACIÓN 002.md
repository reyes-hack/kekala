# Products Module Tracking

## Estado

**Estado:** Completado (estructura de base de datos)

---

# Objetivo

Implementar el catálogo maestro de productos del ERP Kekala.

La tabla `products` representa el núcleo del dominio comercial y será utilizada por los módulos de:

- Inventario
- Compras
- Ventas
- Mermas
- Integraciones
- Dashboard
- Reportes

Todos los movimientos comerciales del ERP referencian un producto.

---

# Arquitectura

Se implementó una única entidad principal:

- products

El objetivo de esta tabla es representar únicamente la identidad permanente del producto.

No almacena información operativa que cambia con el tiempo.

---

# Tabla implementada

## products

Información almacenada:

- Código único del producto
- Nombre comercial
- Descripción
- Categoría
- Unidad de medida
- Estado (Activo/Inactivo)
- Fechas de auditoría

---

# Decisiones de arquitectura

## Producto como entidad comercial

Cada producto representa una unidad comercial completa.

Ejemplos:

- Especial Original
- Especial Flat
- Chocolatudo
- Trufella

No se modelan como combinaciones de atributos.

---

## Catálogos reutilizables

La tabla utiliza los catálogos existentes mediante Foreign Keys hacia `catalog_values`.

Se reutilizan:

- PRODUCT_CATEGORY
- UNIT

Esto evita duplicidad de información y mantiene consistencia en todo el ERP.

---

## Sin precios

No se agregó la columna `sale_price`.

El precio cambia con el tiempo y no forma parte de la identidad del producto.

En el futuro se implementará un módulo independiente para precios, permitiendo mantener historial y listas de precios.

---

## Sin inventario

La tabla no almacena existencias.

El inventario pertenece a cada sucursal y será implementado mediante un módulo especializado.

---

## Sin stock mínimo

No se agregó `minimum_stock`.

El stock mínimo depende de la sucursal y no del producto.

Será administrado en el módulo de inventario por sucursal.

---

## Integración con plataformas externas

Una vez creada la tabla `products`, se agregó la relación pendiente con:

- external_sales_report_items

Esto permite asociar productos importados desde plataformas externas con el catálogo maestro del ERP.

---

# Archivos implementados

## Tables

- schema/tables/inventory/001-products.sql
- schema/tables/inventory/002-link-external-sales-products.sql

## Indexes

- schema/indexes/inventory/001-products.sql

## Triggers

- schema/triggers/inventory/001-products.sql

## Comments

- schema/comments/inventory/001-products.sql

---

# Validaciones realizadas

Se validó correctamente:

- Creación de la tabla
- Foreign Keys
- Restricciones
- Índices
- Trigger `updated_at`
- Comentarios de tabla y columnas
- Integración con `external_sales_report_items`

---

# Pendientes

Los siguientes módulos extenderán la funcionalidad del catálogo de productos:

- Inventario por sucursal
- Movimientos de inventario
- Precios
- Compras
- Ventas
- Mermas
- Costos
- RLS (cuando se implemente el módulo de autenticación)

---

# Estado final

## Completado

- Arquitectura
- Tabla
- Foreign Keys
- Restricciones
- Índices
- Trigger
- Comentarios
- Integración con módulos existentes

## Pendiente

- Seeds iniciales de productos
- Inventario por sucursal
- Precios
- Seguridad (RLS)