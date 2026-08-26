# 020 - Actualización de get_income_statement para Filtros Exactos

**Para: Ángel (Base de Datos)**
**De: Bernardo (Desarrollo)**

Hola Ángel,

El usuario final reportó que los filtros de fecha en el Dashboard de Estado de Resultados (P&L) no funcionaban correctamente, ya que no filtraban los resultados por día exacto. Al revisar tu función original `get_income_statement`, vi que solicitaba `p_target_month` y `p_target_year`, lo cual imposibilitaba utilizar rangos dinámicos.

He creado el script `Supabase/schema/migrations/018-finanzas-exact-dates.sql` que reemplaza tu función anterior (la renombra a `get_income_statement_by_date`) y ahora acepta:
- `p_start_date DATE`
- `p_end_date DATE`

## Instrucciones:
1. Revisa el archivo `Supabase/schema/migrations/018-finanzas-exact-dates.sql`.
2. Ejecuta este script en Supabase Producción/Desarrollo.
3. Asegúrate de eliminar la función vieja si crees que puede generar conflicto: `DROP FUNCTION IF EXISTS public.get_income_statement(UUID, INTEGER, INTEGER);`.
4. El frontend ya está conectado y apuntando a `get_income_statement_by_date` enviando las fechas exactas que selecciona el cliente en el Dashboard.

Cualquier duda, estoy al pendiente.
