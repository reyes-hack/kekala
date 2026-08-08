# Módulo de Auditoría de Inventario y Hardening de Seguridad

## Objetivo

Implementar un módulo de auditoría física de inventario con conteo ciego para empleados, conciliación para administradores y reforzar la seguridad del ERP mediante JWT, RLS y validaciones automáticas.

---

# Componentes implementados

## Tablas

Se incorporaron las siguientes tablas:

- audit_sessions
- audit_counts

Estas almacenan las sesiones de conteo y los productos auditados durante cada proceso de inventario.

---

# Conteo Ciego

El flujo fue diseñado para impedir que los empleados conozcan el inventario teórico durante el conteo.

Proceso:

Empleado

↓

Captura inventario físico

↓

INSERT en audit_counts

↓

Trigger de Base de Datos

↓

Consulta branch_inventory

↓

Calcula expected_stock

↓

Calcula difference

↓

Guarda registro

El frontend únicamente envía el inventario físico (`counted_stock`).

Los campos `expected_stock` y `difference` son calculados automáticamente por la base de datos mediante una función `SECURITY DEFINER`.

---

# Seguridad

Se implementaron políticas RLS utilizando JWT.

Empleado:

- Puede iniciar auditorías.
- Puede finalizar sus propias auditorías.
- Puede registrar conteos.
- No puede consultar branch_inventory.
- No puede consultar audit_counts.

Administrador:

- Puede consultar auditorías.
- Puede revisar diferencias.
- Puede acceder al inventario.
- Puede realizar conciliaciones.

---

# Storage

Se reutilizó el bucket:

- evidence

Configurado para almacenar fotografías de evidencia asociadas a los conteos físicos.

---

# Mejoras de Hardening

Durante esta asignación también se implementaron mejoras adicionales:

- Restricción de una única auditoría activa por sucursal.
- Sincronización automática del estado de auditoría.
- Auditoría de funciones SECURITY DEFINER.
- Validación de políticas RLS.
- Revisión de índices, llaves primarias y estructura general.

---

# Estado

✅ Módulo de Auditoría implementado.

✅ Conteo ciego operativo.

✅ Seguridad basada en JWT y RLS.

✅ Hardening inicial completado.

La arquitectura queda preparada para integrarse con el backend y el frontend del ERP.