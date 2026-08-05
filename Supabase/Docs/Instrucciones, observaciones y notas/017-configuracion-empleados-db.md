# Instrucciones para Ángel (Backend & Supabase) - Configuración y Empleados (Acceso por NIP)

## Contexto
Hemos creado el módulo maestro de **Configuración** (`/configuracion`), donde el Administrador podrá gestionar las sucursales y dar de alta a los empleados. 
Como acordamos, los empleados no usarán correo electrónico para entrar al punto de venta (es impráctico). Usarán un **NIP de 6 dígitos**.

## 1. Modificación de la Tabla `profiles` (o `employees`)
Necesitamos asegurar que cada empleado esté estrictamente ligado a una sucursal para que RLS haga su magia.

**Estructura sugerida para `profiles` (extendiendo auth.users):**
- `id` (UUID, PK, FK a auth.users.id)
- `organization_id` (FK a organizations)
- `branch_id` (FK a branches, NOT NULL para empleados, NULL para super admins)
- `full_name` (TEXT)
- `role` (TEXT) - Valores: 'ADMIN', 'CASHIER'
- `pin_code` (TEXT o HASH) - **¡OJO!** Aquí guardaremos el NIP de acceso rápido.
- `created_at` (TIMESTAMPTZ)

---

## 2. Creación Segura de Usuarios (El Reto Principal)
Si el Administrador intenta crear un usuario usando `supabase.auth.signUp()` desde el frontend, **Supabase automáticamente cerrará la sesión del Admin** y logueará al nuevo empleado. Esto es inaceptable en un ERP.

**SOLUCIÓN: Edge Function o RPC (`crear_empleado_seguro`)**
Debes crear una Edge Function (o RPC con privilegios de `service_role`) que el frontend mandará a llamar.

**Input del Frontend a la función:**
```json
{
  "full_name": "Juan Pérez",
  "branch_id": "uuid-de-la-sucursal",
  "role": "CASHIER",
  "pin_code": "123456"
}
```

**Lógica Interna que debe ejecutar tu función en el Backend:**
1. Crear un usuario dummy en `auth.users` usando el Admin API (`supabase.auth.admin.createUser`). 
   - *Hack sugerido para no usar correos reales:* Genera un correo sintético basado en el nombre o un UUID: `juan.perez+emp@kekala.app`.
   - *Contraseña:* El mismo `pin_code` (si cumple con longitud) o una genérica fuerte, ya que el logueo real lo haremos nosotros validando el `pin_code`.
2. Insertar el registro en la tabla `profiles` vinculando el `id` recién creado, el `branch_id` y guardando de forma segura (hasheada de preferencia) el `pin_code`.

---

## 3. Login por NIP (Custom Auth)
Puesto que los empleados entrarán en una tablet/computadora de la sucursal tocando su nombre y poniendo un PIN:
- El frontend mostrará la lista de empleados de esa sucursal.
- El empleado elegirá su nombre y pondrá su NIP de 6 dígitos.
- Mandaremos esto a otra función tuya (ej. `login_con_nip(profile_id, pin_code)`) que, si hace match, devuelva un Custom JWT o simplemente inicie la sesión de Auth usando las credenciales sintéticas de ese usuario por detrás.

---

## 4. Políticas de Seguridad (RLS) - ¡VITAL!
Ahora que el `branch_id` está en el perfil del empleado, Ángel, necesitamos que configures las políticas **exactas** según esta matriz de accesos:

### Matriz de Permisos por Rol:
**1. `ADMIN` (Administrador General)**
- **Acceso Frontend:** TODO (Dashboard, Inventario global, Sucursales, Recetario, Reportes).
- **Acceso BD (RLS):** `SELECT`, `INSERT`, `UPDATE`, `DELETE` en **todas** las tablas sin restricción de sucursal.

**2. `CASHIER` (Empleado de Sucursal)**
- **Acceso Frontend LIMITADO a:**
  - Registrar Gastos (Compras locales).
  - Auditoría de Inventario (Conteos físicos).
  - Reportes de Mermas.
  - *(Operación normal de sucursal: Ventas en POS y Cortes de Caja).*
- **Acceso BD (RLS):**
  - **Solo puede** hacer `SELECT` e `INSERT` en las tablas: `expenses`, `inventory_audit_sessions`, `waste_records`, `sales`, `cash_closures`.
  - **La regla de oro:** Su acceso está anclado a su sucursal. `table.branch_id = auth.uid().branch_id`.
  - **NO PUEDE:** Eliminar (`DELETE`) nada, modificar (`UPDATE`) catálogos de inventario, ni ver información de otras sucursales.

Ejemplo de política RLS para un empleado en `expenses`:
```sql
CREATE POLICY "Empleados solo ven/crean gastos de su sucursal" 
ON expenses FOR ALL 
USING (
  branch_id = (SELECT branch_id FROM profiles WHERE id = auth.uid())
);
```
