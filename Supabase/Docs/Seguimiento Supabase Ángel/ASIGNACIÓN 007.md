# Expenses Module Tracking

## Objetivo

Implementar el módulo de Gastos Operativos del ERP para registrar egresos realizados por las sucursales, asociar comprobantes digitales y preparar la información para futuros reportes financieros y contables.

---

# Componentes implementados

## Expenses

Tabla principal para registrar gastos operativos.

Se incorporó soporte para:

- Organización
- Sucursal
- Folio del gasto
- Categoría del gasto
- Establecimiento
- Método de pago
- Proveedor (opcional)
- Usuario que registra
- Moneda
- Subtotal
- Impuestos
- Total
- Fecha del gasto
- Descripción
- Observaciones
- Metadata
- Auditoría

---

## Expense Attachments

Tabla para almacenar múltiples comprobantes asociados a un gasto.

Cada archivo conserva:

- Organización
- Gasto relacionado
- Usuario que realizó la carga
- Nombre original
- URL en Supabase Storage
- Tipo MIME
- Tamaño del archivo
- Metadata
- Fecha de carga

El diseño permite asociar múltiples comprobantes a un mismo gasto.

---

# Catálogos implementados

## EXPENSE_ESTABLISHMENT

Se implementó un catálogo reutilizable para identificar el establecimiento donde ocurrió el gasto.

Valores iniciales:

- OXXO
- COSTCO
- OFFICE_DEPOT
- WALMART
- HOME_DEPOT
- SAMS_CLUB
- AMAZON
- MERCADO_LIBRE
- CFE
- TELMEX
- OTRO

---

# Integración con Supabase Storage

Se definió la estructura recomendada para almacenar comprobantes.

Bucket sugerido:

expense-attachments

Estructura:

organization_id/

└── branch_id/

&nbsp;&nbsp;&nbsp;&nbsp;└── expense_id/

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── ticket.jpg

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── factura.pdf

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── xml.xml

Esta organización facilita la administración de archivos, futuras políticas de acceso y búsquedas por organización, sucursal o gasto.

---

# Mejoras respecto a la asignación

Se fortaleció el diseño original mediante:

- Arquitectura multiempresa.
- Integración con el sistema central de catálogos.
- Asociación opcional con proveedores.
- Manejo de subtotal, impuestos y total.
- Soporte para múltiples comprobantes por gasto.
- Preparación para integraciones con Supabase Storage.
- Uso de metadata para futuras extensiones.

---

# Archivos implementados

## Tables

- expenses
- expense_attachments

## Indexes

- expenses
- expense_attachments

## Triggers

- expenses (updated_at)

## Catálogos

- EXPENSE_ESTABLISHMENT

---

# Estado

✅ Assignment 007 completada.

El módulo de Gastos queda preparado para registrar egresos operativos, almacenar comprobantes digitales e integrarse con futuros reportes financieros y contables.