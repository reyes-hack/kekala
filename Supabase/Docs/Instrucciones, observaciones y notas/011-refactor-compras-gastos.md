# Refactorización Simplificada de Compras y Gastos

**Para: Ángel (Arquitecto de BD)**
**De: Bernardo (Antigravity)**
**Fecha: 2026-08-04**

## Contexto y Cambios Realizados

Ángel, por necesidades operativas inmediatas en el Frontend y para acelerar el lanzamiento de la Web App en la sucursal de "Las Américas", he simplificado drásticamente la estructura de las tablas de Órdenes de Compra y Gastos. 

La estructura anterior era muy normalizada y requería tablas intermedias (`purchase_order_items`, `suppliers`, etc.) que todavía no tenían módulos en el frontend. Para no frenar el desarrollo:
1. Las órdenes de compra ahora guardan su detalle como un JSON en la columna `order_data`.
2. Los gastos ahora guardan los catálogos como texto simple en lugar de UUIDs (`category`, `establishment`, `payment_method`, `responsible`).

He reemplazado los scripts SQL directamente en el repositorio en las siguientes rutas para reflejar la realidad actual de la base de datos de desarrollo:
- `Supabase/schema/tables/purchasing/002-purchase_orders.sql`
- `Supabase/schema/tables/expenses/001-expenses.sql`

## Tareas Pendientes para ti (Ángel):
1. **Revisión de Seguridad RLS:** Actualmente dejé las tablas con RLS en `true` para acceso anónimo (`USING (true)`). Necesitamos que revises y apliques las políticas correctas cuando implementemos la autenticación final.
2. **Revisión de `inventory_movements`:** Agregué lógica en el frontend que inserta directamente en `inventory_movements` cuando una orden de compra pasa a estado "ENTREGADA". Verifica que esto no choque con algún trigger futuro que tuvieras planeado para el cálculo de existencias.

*Nota: Por favor, asegúrate de mantener estos archivos en el repo en lugar de dejarlos sueltos si haces futuros ajustes.*
