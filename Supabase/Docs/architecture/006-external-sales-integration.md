# External Sales Integration

## Objetivo

Definir la arquitectura para la integración de reportes de ventas provenientes de sistemas externos.

Este módulo tiene como propósito almacenar información histórica proveniente de plataformas que únicamente proporcionan resúmenes de ventas y no entregan el detalle transaccional (tickets individuales).

---

# Contexto

Actualmente Foodbot proporciona únicamente un resumen diario por sucursal.

La información disponible incluye:

- Total de órdenes
- Total de ventas
- Ticket promedio
- Ventas agregadas por producto

No existe acceso a:

- Tickets individuales
- Clientes
- Métodos de pago
- Horas de venta
- Detalle de cada transacción

Por lo tanto, esta información no puede reconstruirse posteriormente desde el ERP y debe almacenarse como datos importados.

---

# Objetivos del módulo

Este módulo permitirá:

- Conservar históricos de ventas externas.
- Alimentar dashboards.
- Generar reportes históricos.
- Comparar ventas entre sucursales.
- Comparar productos vendidos.
- Servir como fuente temporal mientras el ERP administra las ventas directamente.

---

# Alcance

Este módulo NO representa ventas del ERP.

Representa únicamente información importada desde sistemas externos.

Por esta razón pertenece al módulo:

schema/tables/integrations/

y no al módulo Sales.

---

# Principios de diseño

La integración debe ser:

- Independiente del proveedor.
- Escalable.
- Reutilizable.
- Auditada.
- No invasiva para el dominio principal.

---

# Proveedores soportados

Inicialmente:

- FOODBOT

Posteriormente podrá soportar:

- POS propio
- Uber Eats
- Rappi
- Shopify
- Otros

Sin modificar la estructura de las tablas.

---

# Flujo

Proveedor

↓

Scraper

↓

JSON

↓

Proceso de importación

↓

Tablas de integración

↓

Dashboard

↓

Reportes

---

# Modelo propuesto

external_sales_reports

↓

external_sales_report_items

---

# external_sales_reports

Representa un reporte diario importado para una sucursal.

Contiene únicamente información agregada.

Ejemplo:

Sucursal

↓

28 Julio 2026

↓

Ventas

↓

Ticket promedio

↓

Total órdenes

---

# external_sales_report_items

Representa el detalle agregado por producto.

Ejemplo:

Reporte diario

↓

Producto A

Producto B

Producto C

Cada registro representa un resumen por producto.

Nunca una venta individual.

---

# Relaciones

organizations

↓

branches

↓

external_sales_reports

↓

external_sales_report_items

↓

products

---

# Identificadores

Internamente el ERP utilizará:

- organization_id
- branch_id
- product_id

Los códigos externos:

- branchCode
- productCode

serán utilizados únicamente durante el proceso de importación para localizar las entidades internas.

No serán utilizados como llaves foráneas.

---

# Fuente

Cada reporte almacenará el proveedor que originó la información.

Ejemplo:

FOODBOT

Esto permitirá soportar múltiples integraciones utilizando la misma estructura.

---

# Información original

Cada reporte conservará el JSON recibido.

Objetivos:

- Auditoría
- Reprocesamiento
- Compatibilidad futura
- Recuperación ante cambios del proveedor

El JSON no reemplaza el modelo relacional.

Únicamente conserva la evidencia de la importación.

---

# Responsabilidades

Este módulo NO calcula indicadores.

Los dashboards consumirán la información almacenada.

Este módulo únicamente preserva los datos importados.

---

# Futuro

Cuando el ERP administre ventas propias:

sales

sale_items

serán la fuente oficial.

Las tablas de integración continuarán funcionando únicamente para proveedores externos.

---

# Decisiones tomadas

✅ Las integraciones viven en un módulo independiente.

✅ Las tablas serán genéricas.

✅ Se soportarán múltiples proveedores.

✅ Se utilizarán llaves internas (UUID).

✅ Se conservará el JSON original para auditoría.

✅ Este módulo no reemplaza las ventas del ERP.

---

# Pendientes

Diseñar:

- external_sales_reports
- external_sales_report_items

Definir:

- índices
- restricciones
- políticas
- proceso de importación