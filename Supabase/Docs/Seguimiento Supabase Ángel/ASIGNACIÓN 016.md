# Notificaciones y Configuración Financiera

## Objetivo

Implementar la infraestructura base para el sistema de notificaciones del ERP y el nuevo esquema dinámico de configuración financiera por sucursal.

---

# Sistema de Notificaciones

## Tabla `notifications`

Se creó la tabla `notifications` como centro de eventos del ERP.

La estructura permite registrar notificaciones tanto globales como específicas por sucursal.

Campos principales:

- organization_id
- branch_id
- title
- message
- type
- reference_type
- reference_id
- is_read
- metadata
- created_at

Se agregaron índices para optimizar consultas por:

- organización
- sucursal
- tipo
- fecha
- estado de lectura
- entidad relacionada

---

# Servicio Centralizado de Notificaciones

Se implementó la función:

- `create_notification()`

Esta función centraliza la creación de notificaciones dentro de la base de datos.

Todos los módulos futuros (Ventas, Compras, Auditorías, Mermas, Transferencias, Foodbot, etc.) deberán utilizar esta función en lugar de realizar `INSERT` directos sobre la tabla `notifications`.

Con esto se mantiene una única lógica para la generación de eventos del sistema.

---

# Dependencia Identificada

La asignación contemplaba generar notificaciones automáticas para diferencias en cortes de caja mediante un trigger sobre la tabla:

- `cash_closures`

Durante la revisión del esquema se confirmó que dicha tabla aún no existe.

Por este motivo no fue posible implementar el trigger solicitado.

La función `create_notification()` queda preparada para ser reutilizada cuando el módulo de Cortes de Caja sea incorporado.

---

# Configuración Financiera

## Tabla `branch_settings`

Se creó la tabla `branch_settings` para almacenar configuraciones permanentes por sucursal.

Actualmente incluye:

- card_commission_percentage
- metadata

La estructura permite incorporar nuevas configuraciones sin modificar el esquema mediante el campo `metadata`.

Existe una única configuración por sucursal.

---

## Tabla `branch_fixed_costs`

Se implementó un modelo dinámico para registrar costos fijos mensuales.

Cada registro pertenece a un mes específico y a una categoría financiera.

Campos principales:

- organization_id
- branch_id
- month_year
- category
- concept
- amount
- notes
- metadata

Categorías iniciales:

- RENTA
- NOMINA
- SERVICIOS
- MARKETING
- MANTENIMIENTO
- SEGUROS
- IMPUESTOS
- OTROS

Este diseño reemplaza el modelo de columnas fijas y permite registrar cualquier cantidad de costos por sucursal y por periodo.

---

# Seguridad

Las políticas RLS específicas para `notifications` se posponen temporalmente.

La decisión arquitectónica fue implementarlas directamente sobre la infraestructura basada en JWT ya desarrollada para el ERP, evitando mantener dos modelos distintos de autorización.

---

# Estado

✅ Tabla `notifications` implementada.

✅ Servicio reutilizable `create_notification()` implementado.

✅ Tabla `branch_settings` implementada.

✅ Tabla `branch_fixed_costs` implementada.

⏳ Trigger automático para `cash_closures` pendiente hasta la implementación del módulo de Cortes de Caja.

⏳ Políticas RLS de `notifications` pendientes para integrarse con el modelo definitivo basado en JWT.

La infraestructura queda preparada para que futuros módulos publiquen eventos utilizando un único servicio centralizado de notificaciones.