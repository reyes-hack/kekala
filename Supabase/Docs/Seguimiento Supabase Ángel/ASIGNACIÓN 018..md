# Documentación — Dashboard y Estado de Resultados (P&L)

## 1. Objetivo

Se implementó en Supabase la lógica financiera necesaria para que el Dashboard principal pueda consultar el **Estado de Resultados (P&L)** de una sucursal para un mes y año determinados.

El objetivo principal es que los cálculos financieros se realicen directamente en PostgreSQL, evitando que el Frontend tenga que procesar grandes cantidades de registros de ventas, compras y gastos.

La función implementada es:

```text
public.get_income_statement(
    p_branch_uuid UUID,
    p_target_month INTEGER,
    p_target_year INTEGER
)

La función devuelve un objeto JSONB con los resultados financieros ya calculados.

2. Función RPC implementada

Archivo:

Supabase/schema/functions/finance/001-get-income-statement.sql

Función:

get_income_statement

Parámetros:

p_branch_uuid
p_target_month
p_target_year

Ejemplo de llamada desde el Frontend:

const { data, error } = await supabase.rpc(
  'get_income_statement',
  {
    p_branch_uuid: branchId,
    p_target_month: month,
    p_target_year: year
  }
);

El Frontend solamente consume el resultado final.

3. Ventas / Ingresos

El RPC calcula las ventas del periodo seleccionado utilizando la tabla:

sales

Se consideran:

subtotal
discount_amount

La lógica utilizada es:

gross_sales = SUM(subtotal)

discounts = SUM(discount_amount)

net_sales = gross_sales - discounts

La venta neta nunca se permite que resulte negativa.

Desglose de métodos de pago

También se prepara el desglose de pagos utilizando:

payments
catalog_values

Se reconocen los códigos:

CASH
CARD
TRANSFER
DIGITAL_WALLET

El resultado contiene:

{
  "cash": 0,
  "card": 0,
  "transfer": 0,
  "digital_wallet": 0
}

Cuando existan pagos reales, estos valores se calcularán automáticamente.

4. Costo de Ventas / COGS

Se determinó que purchase_orders.order_data no contiene actualmente un importe monetario confiable.

Por ese motivo, el COGS se calcula utilizando:

purchase_orders
purchase_order_items

La relación es:

purchase_orders.id
        ↓
purchase_order_items.purchase_order_id

Solamente se consideran órdenes con:

status = 'ENTREGADA'

El importe utilizado es:

purchase_order_items.total_amount

Por lo tanto:

COGS = SUM(purchase_order_items.total_amount)

Las órdenes se filtran por:

sucursal
periodo
estado ENTREGADA

También se genera un breakdown por orden de compra.

5. Gastos Operativos

Los gastos registrados se obtienen de:

expenses

Filtrados por:

sucursal
fecha inicial del periodo
fecha final del periodo

La suma utilizada es:

registered_expenses = SUM(expenses.amount)

También se genera un desglose por:

expenses.category
6. Costos Fijos Dinámicos

Se incorporó la tabla:

branch_fixed_costs

La columna:

month_year

fue confirmada como:

DATE

Por lo tanto, el RPC utiliza directamente el rango de fechas correspondiente al mes.

Los costos fijos se calculan mediante:

SUM(branch_fixed_costs.amount)

filtrando por:

branch_id
month_year

El resultado diferencia entre:

registered_expenses
fixed_costs

y ambos forman parte del OPEX:

operating_expenses =
    registered_expenses
    +
    fixed_costs

La aplicación deberá evitar registrar como expense un costo que ya haya sido configurado como branch_fixed_cost, para evitar doble contabilización.

7. Gastos Financieros

Las comisiones bancarias se calculan sobre las ventas realizadas con:

CARD

La configuración se obtiene desde:

branch_settings.card_commission_percentage

Si la sucursal no tiene una configuración registrada, se utiliza:

2.5%

La fórmula utilizada es:

financial_expenses =
    card_sales
    ×
    card_commission_percentage
    /
    100

El resultado incluye:

importe de ventas con tarjeta
porcentaje aplicado
comisión calculada
8. Cálculo de Utilidades

El RPC realiza toda la matemática dentro de PostgreSQL.

Utilidad Bruta
gross_profit =
    net_sales
    -
    cogs
Utilidad Operativa / EBIT
operating_profit =
    gross_profit
    -
    operating_expenses
Utilidad Neta
net_profit =
    operating_profit
    -
    financial_expenses
9. Estructura de respuesta

La función devuelve un JSONB con una estructura equivalente a:

{
  "period": "2026-08",
  "branch_id": "uuid",

  "revenues": {
    "gross_sales": 0,
    "discounts": 0,
    "net_sales": 0,

    "payment_breakdown": {
      "cash": 0,
      "card": 0,
      "transfer": 0,
      "digital_wallet": 0
    }
  },

  "cogs": {
    "total": 0,
    "breakdown": []
  },

  "gross_profit": 0,

  "operating_expenses": {
    "total": 0,
    "breakdown": [],
    "registered_expenses": 0,
    "fixed_costs": 0
  },

  "operating_profit": 0,

  "financial_expenses": {
    "total": 0,
    "breakdown": []
  },

  "net_profit": 0
}

Esta estructura está preparada para ser consumida directamente por el Dashboard.

10. Seguridad

La función fue creada como:

SECURITY DEFINER

y utiliza:

SET search_path = public

Esto permite realizar los cálculos independientemente del RLS de las tablas internas, pero la función implementa explícitamente su propia autorización antes de devolver información.

ADMIN

El ADMIN puede consultar el Estado de Resultados de cualquier sucursal autorizada.

La comprobación utiliza:

is_jwt_admin()
CASHIER

El CASHIER solamente puede consultar información de su propia organización y sucursal.

La validación utiliza:

has_jwt_role('CASHIER')

y:

is_same_org_and_branch(
    organization_id,
    branch_id
)

Un empleado no puede solicitar el P&L de otra sucursal.

11. Permisos del RPC

Se revocó el acceso general:

PUBLIC
anon

y se otorgó únicamente:

authenticated

Permisos finales:

authenticated → EXECUTE
postgres       → EXECUTE
service_role   → EXECUTE
anon           → SIN EXECUTE

Esto evita que usuarios anónimos puedan ejecutar directamente el RPC financiero.

12. Validaciones realizadas

Se verificó que la función existe correctamente:

get_income_statement
FUNCTION
DEFINER

También se confirmó que:

authenticated

tiene permiso:

EXECUTE

y que anon no tiene permiso para ejecutar la función.

13. Prueba del contexto de autenticación

Desde el SQL Editor se comprobó:

current_user = NULL
is_admin = false
has_admin_role = false
has_cashier_role = false

Esto es esperado porque el SQL Editor no proporciona el JWT de una sesión autenticada del Frontend.

Por este motivo, ejecutar directamente:

SELECT public.get_income_statement(...);

desde el SQL Editor produjo correctamente:

FORBIDDEN:
El usuario no tiene un rol autorizado para consultar el Estado de Resultados.

Este comportamiento confirma que la protección del RPC no debe eliminarse para facilitar pruebas desde el SQL Editor.

14. Validación de datos actuales

Se realizaron comprobaciones sobre los datos disponibles.

Para la sucursal:

Américas Veracruz

y el periodo:

Agosto 2026

se confirmó:

expenses = 75.00
fixed_costs = 0

También se confirmó que actualmente no existen datos en:

sales
payments
purchase_order_items

para las pruebas realizadas.

Por lo tanto, el escenario actual esperado es:

Ventas netas       = 0.00
COGS               = 0.00
Utilidad bruta     = 0.00
Gastos operativos  = 75.00
EBIT               = -75.00
Comisión bancaria  = 0.00
Utilidad neta      = -75.00

Esto es consistente con los datos actualmente existentes.

15. Estado de la implementación
Backend / Supabase
✅ RPC implementado
✅ Cálculos financieros en PostgreSQL
✅ Ventas netas
✅ Descuentos
✅ Métodos de pago
✅ COGS
✅ Gastos operativos
✅ Costos fijos dinámicos
✅ Comisión bancaria
✅ Utilidad bruta
✅ EBIT
✅ Utilidad neta
✅ Breakdown financiero
✅ Respuesta JSONB
✅ SECURITY DEFINER
✅ Validación ADMIN
✅ Validación CASHIER
✅ Validación de sucursal
✅ Permisos EXECUTE configurados
16. Prueba pendiente de integración Frontend

La validación final utilizando un JWT real debe realizarse desde el Frontend, ya que el SQL Editor no proporciona el contexto autenticado necesario para probar:

auth.uid()
auth.jwt()
app_metadata.roles

Esta prueba corresponde a integración/QA y no requiere modificar nuevamente el RPC.

Se deberá comprobar desde el Dashboard:

1. ADMIN → consultar Américas Veracruz
   Resultado esperado: ✅ Permitido

2. ADMIN → consultar El Dorado Veracruz
   Resultado esperado: ✅ Permitido

3. CASHIER de Américas → consultar Américas
   Resultado esperado: ✅ Permitido

4. CASHIER de Américas → consultar El Dorado
   Resultado esperado: ❌ Bloqueado

El Backend queda preparado para estas pruebas.

17. Conclusión

La asignación de Dashboard y Estado de Resultados queda implementada a nivel Backend/Supabase.

El Dashboard no necesita realizar cálculos financieros pesados en el Frontend. Solamente deberá enviar:

branch_id
month
year

al RPC:

get_income_statement

y consumir el JSONB resultante.

La única actividad pendiente es la prueba de integración desde una sesión autenticada real del Frontend, para validar el flujo completo de permisos ADMIN/CASHIER y el consumo del resultado desde el Dashboard.

Estado de la asignación: BACKEND COMPLETADO ✅