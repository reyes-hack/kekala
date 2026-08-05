# Instrucciones para Ángel (Backend & Supabase) - Cortes de Caja y Finanzas

## Contexto
Vamos a crear el módulo "Cortes de Caja" que emula la sábana financiera en Excel de la operación. El empleado realizará el corte diario, reportando cuánto contó, y el sistema (con los datos de Foodbot) sacará las diferencias y automatizará el Estado de Resultados Mensual.

Además, los "retiros de caja" se registrarán automáticamente en la tabla de gastos que ya existe, pero deben estar vinculados a este cierre de caja.

## 1. Nueva Tabla: `cash_closures` (Cortes de Caja)
Deberás crear esta tabla para registrar los cierres diarios.
**Columnas sugeridas:**
- `id` (UUID, PK)
- `organization_id` (FK a organizations)
- `branch_id` (FK a branches)
- `date` (DATE) - El día al que corresponde el corte.
- `closed_by` (UUID, FK a auth.users o profiles)
- `starting_cash` (NUMERIC) - Efectivo inicial del día en la caja.
- `foodbot_sales_cash` (NUMERIC) - Calculado automáticamente.
- `foodbot_sales_card` (NUMERIC) - Calculado automáticamente.
- `foodbot_tickets_count` (INTEGER)
- `foodbot_avg_ticket` (NUMERIC)
- `reported_cash` (NUMERIC) - Lo que el empleado contó físicamente en monedas/billetes.
- `reported_vouchers` (NUMERIC) - La suma de los vouchers de la terminal que contó el empleado.
- `cash_difference` (NUMERIC) - `reported_cash - (starting_cash + foodbot_sales_cash - retiros)`
- `card_difference` (NUMERIC) - `reported_vouchers - foodbot_sales_card`
- `status` (TEXT) - Ej. 'DRAFT', 'COMPLETED'.
- `created_at`

## 2. Nueva Tabla: `branch_finances_config` (Costos Fijos)
Para que el Administrador vea el Estado de Resultados automático por mes, necesitamos guardar los costos fijos por sucursal y mes.
- `id` (UUID, PK)
- `branch_id` (FK a branches)
- `month_year` (TEXT o DATE) - Ej: "2026-06"
- `rent_amount` (NUMERIC)
- `salaries_amount` (NUMERIC)
- `card_commission_percentage` (NUMERIC) - Default: 2.5 (La comisión que cobra la terminal).

## 3. Triggers y Lógica en BD (MUY IMPORTANTE)
1. **Arrastre de Caja Inicial:**
   Necesitamos un Trigger que, al marcar un corte (`cash_closures`) como `COMPLETED`, calcule la `caja final` de ese día (Efectivo final en el cajón) y automáticamente cree/actualice el registro del DÍA SIGUIENTE colocando ese monto en `starting_cash`.
2. **Vinculación con Gastos:**
   En el Frontend, cuando el empleado reporta el corte, si dice que hubo "Retiros" (ej. para pagar garrafones), insertará un registro en la tabla `expenses` (gastos). Necesitamos que la tabla `expenses` tenga una columna opcional `cash_closure_id` para saber que ese gasto salió de la caja de ese día.
3. **Ciberseguridad (RLS):**
   - El Empleado SÓLO puede hacer `INSERT`/`UPDATE` a `cash_closures` y `expenses` del día actual y de SU sucursal. Jamás debe ver cierres históricos.
   - El Administrador tiene acceso completo (`SELECT`, `UPDATE`) a todo.
