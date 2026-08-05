# Instrucciones para Ángel (Backend & Supabase) - Dashboard y Estado de Resultados

## Contexto
El Dashboard principal de la aplicación es un **Estado de Resultados (P&L)** completo. Por temas de rendimiento en el Frontend, es IMPERATIVO que los cálculos matemáticos (agrupación de miles de ventas, gastos, etc.) se hagan en Supabase a través de una función RPC, y que el frontend solo consuma el resultado final.

## Requisito: RPC `get_income_statement(branch_uuid, target_month, target_year)`

Necesitamos una función en la Base de Datos que, dado el ID de una sucursal y un mes/año, calcule las siguientes variables y devuelva un JSON o un recordset estructurado.

### 1. Ventas Netas (Ingresos)
Se debe calcular a partir de la tabla de Ventas (`sales` o lo que hayas definido para tickets).
- Sumar todas las ventas del mes para esa sucursal.
- Si hay descuentos aplicados en tickets, restar para sacar la **Venta Neta**.
- Opcional pero recomendado: Desglosar cuánto fue en Efectivo y cuánto en Tarjeta (ayudará a cruzar con la comisión bancaria).

### 2. Costo de Ventas (COGS - Mercancía)
Acordamos que el Costo de Ventas se obtendrá sumando todas las Órdenes de Compra (`purchase_orders` o `purchases`) que se marcaron como Pagadas/Recibidas en ese mes para esa sucursal.
- Asegúrate de excluir gastos operativos (ej. pago de luz), aquí **solo va materia prima y mercancía vendible**.

### 3. Gastos Operativos (OPEX)
Se debe sumar y agrupar la tabla `expenses` (o `fixed_costs`).
El resultado debe devolver un sub-objeto o array agrupado por categoría. Por ejemplo:
- "Sueldos y Salarios": $22,500
- "Renta Comercial": $22,500
- "Servicios (Luz/Internet)": $2,400
- "Otros Gastos": $8,500

### 4. Gastos Financieros (Comisiones Bancarias)
Como regla de negocio, Kekala asume por defecto un **2.5% de comisión** (este valor debería poder leerse de una tabla de configuración de la sucursal, pero si no la hay, hardcodealo temporalmente como parámetro configurable en tu función).
Este 2.5% se debe multiplicar por el total de ingresos cobrados con "Tarjeta" o "Terminal" en ese mes.

### 5. Cálculo de Utilidades (Resultados)
Tu función debe devolver la matemática ya hecha:
1. `gross_profit` (Utilidad Bruta) = Ventas Netas - Costo de Ventas.
2. `operating_profit` (EBIT) = Utilidad Bruta - Suma de Gastos Operativos.
3. `net_profit` (Utilidad Neta) = EBIT - Gastos Financieros.

## Ejemplo de Estructura de Salida Esperada:
```json
{
  "period": "2026-06",
  "branch_id": "uuid",
  "revenues": {
    "gross_sales": 250767.50,
    "discounts": 2862.50,
    "net_sales": 247905.00
  },
  "cogs": {
    "total": 163393.31,
    "breakdown": [
      { "concept": "Pedido 1", "amount": 49978.00 }
    ]
  },
  "gross_profit": 84511.69,
  "operating_expenses": {
    "total": 59433.00,
    "breakdown": [
      { "category": "Renta", "amount": 22500.00 },
      { "category": "Sueldos", "amount": 22500.00 }
    ]
  },
  "operating_profit": 25078.69,
  "financial_expenses": {
    "total": 2322.49,
    "breakdown": [
      { "category": "Comisiones Bancarias", "amount": 2322.49 }
    ]
  },
  "net_profit": 22756.20
}
```

Por favor, implementa esto como un SQL view o RPC. El frontend asumirá esta estructura (o similar) para graficar los datos.
