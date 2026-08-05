# Instrucciones para Ángel (Backend & Supabase) - Notificaciones y Costos Fijos Dinámicos

## 1. Sistema de Notificaciones (Centro de Comando)
El ERP tendrá una "Campanita" de notificaciones globales en la esquina superior derecha para el Administrador.

**Crear tabla `notifications`:**
- `id` (UUID, PK)
- `organization_id` (FK a organizations)
- `branch_id` (FK a branches, Nullable si es global)
- `title` (TEXT) - Ej. "Faltante en Corte de Caja"
- `message` (TEXT) - Ej. "La sucursal Américas reportó un faltante de $250.00 en efectivo."
- `type` (TEXT) - Valores: 'INFO', 'WARNING', 'ALERT', 'SUCCESS'.
- `is_read` (BOOLEAN) - Default: false
- `created_at` (TIMESTAMPTZ)

**Triggers Requeridos (Magia Automática):**
- **Corte de Caja Anómalo:** Crea un Trigger en `cash_closures`. Si un empleado inserta un registro y el cálculo de `cash_difference` o `card_difference` es MENOR a 0 (faltante), el trigger debe insertar un registro tipo 'ALERT' en la tabla `notifications`.
- **Mermas / Auditorías (Futuro):** Si una auditoría ciega genera una pérdida mayor a X cantidad de dinero o de items, disparar otra alerta.

**Seguridad (RLS):**
- `admin`: Puede leer (SELECT) y actualizar `is_read` (UPDATE). 
- `employee`: No debe tener acceso a las notificaciones globales.

---

## 2. Refactorización de Costos Fijos Financieros
En lugar de tener solo "Renta" y "Salario" en columnas duras (como lo solicitamos en el documento 015), el cliente requiere que los Costos Fijos mensuales sean **Dinámicos y Categorizables**.

**Modificación a la propuesta de `branch_finances_config`:**
Renombra/Rediseña la tabla a `branch_fixed_costs`:
- `id` (UUID, PK)
- `branch_id` (FK a branches)
- `month_year` (TEXT o DATE) - Ej: "2026-06"
- `category` (TEXT) - Ej. 'RENTA', 'NOMINA', 'SERVICIOS' (luz, agua), 'MARKETING'.
- `concept` (TEXT) - Ej. "Renta Local Plaza", "Sueldo Supervisor".
- `amount` (NUMERIC)
- `created_at` (TIMESTAMPTZ)

*(Nota: La `card_commission_percentage` sí puedes dejarla como un setting único por sucursal en una tabla `branch_settings`, ya que no es un porcentaje mensual sino fijo sobre la venta con terminal).*
