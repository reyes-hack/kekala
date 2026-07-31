# External Sales Integration Tracking

## Estado

**Estado:** Completado (estructura de base de datos)

## Objetivo

Permitir almacenar información proveniente de plataformas externas de venta
(Foodbot inicialmente), desacoplando la integración del módulo de Ventas del ERP.

---

# Arquitectura

Se implementaron dos tablas principales:

- external_sales_reports
- external_sales_report_items

La integración pertenece al módulo `integrations`, no al módulo `sales`.

---

# Tablas implementadas

## external_sales_reports

Almacena el resumen diario por sucursal y proveedor.

Información relevante:

- organización
- sucursal
- proveedor
- fecha
- total de órdenes
- ventas totales
- ticket promedio
- JSON original
- fechas de auditoría

---

## external_sales_report_items

Almacena el detalle por producto de cada reporte.

Información relevante:

- organización
- reporte
- producto ERP (opcional)
- código del proveedor
- nombre del proveedor
- órdenes
- cantidad vendida
- ventas
- JSON original

---

# Decisiones de arquitectura

## Integraciones separadas del dominio

Los datos externos no forman parte del dominio de Ventas.

Se almacenan primero en el módulo Integrations.

---

## product_id opcional

Actualmente el ERP aún no implementa el catálogo de productos.

Por ello:

- product_id permanece NULLABLE.
- La llave foránea será agregada cuando exista la tabla products.

Esto evita bloquear las importaciones.

---

## Conservación de datos originales

Se almacenan:

- source_product_code
- source_product_name
- raw_data

Esto permite auditoría y reprocesamiento.

---

# Pendientes

- Implementar tabla products.
- Agregar FK hacia products.
- Implementar RLS.
- Desarrollar proceso ETL de conciliación entre productos externos y productos del ERP.
- Implementar importador Foodbot.

---

# Estado final

## Completado

- Arquitectura
- Tablas
- Índices
- Triggers
- Comentarios

## Pendiente

- RLS
- ETL
- Productos