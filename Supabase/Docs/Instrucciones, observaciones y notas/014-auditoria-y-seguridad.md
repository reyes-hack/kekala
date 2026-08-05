# Instrucciones para Ángel (Backend & Supabase) - Auditoría y Seguridad

## Contexto
Hemos construido la interfaz para el módulo de **Auditoría de Inventario** (`Auditoria.jsx`), el cual tiene dos flujos hiper-críticos:
1. **Conteo Ciego (Empleado):** El empleado cuenta físicamente los productos y toma fotos de evidencia. NO debe ver los números del sistema (stock teórico).
2. **Conciliación (Administrador):** El admin revisa las discrepancias y aprueba el ajuste de inventario.

## 1. Arquitectura de Login (Doble Interfaz)
Nuestro cliente requiere que los empleados ("personas mayores que la tecnología no les late") NO usen correo electrónico, sino un Alias/Usuario simple y un NIP de 6 dígitos. Sin embargo, el Admin requiere alta seguridad.

**Propuesta de Solución para Supabase Auth:**
- La pantalla de login del Frontend tendrá dos pestañas: **Admin** y **Empleado**.
- **Admin:** Usa el flujo normal de Supabase (Email y Password fuerte).
- **Empleado:** El empleado ingresa un nombre (ej. `juan`) y un NIP (`123456`).
- **Hack Backend (Tu tarea):** Cuando el Admin registre a un empleado, tú generarás mediante una Edge Function o un trigger un usuario en Auth con un correo genérico oculto (ej. `juan.sucursal@kekala.internal`) usando el NIP como contraseña. 
- Al loguearse el empleado, el frontend arma el correo genérico en segundo plano y hace el `signInWithEmailAndPassword`, logrando el login con NIP sin que el empleado sepa qué es un correo.

## 2. Perfiles y Permisos (Role Level Security - RLS)
Debes extender la tabla `profiles` para incluir un `role` (`admin` o `employee`).

**Políticas (Ciberseguridad Impenetrable):**
- **Tabla `branch_inventory`**: 
  - `admin`: Tiene permisos de lectura y escritura completos.
  - `employee`: **TIENE PROHIBIDO LEER ESTA TABLA**. El empleado no debe poder ver bajo ninguna circunstancia el `current_stock`.
- **Tabla `audit_sessions`** (CREARLA):
  - `id` (UUID), `organization_id`, `branch_id`, `started_by`, `status` (IN_PROGRESS, COMPLETED), `started_at`, `completed_at`.
  - `employee`: Puede hacer `INSERT` (iniciar sesión) y `UPDATE` (marcar completada) solo donde su ID coincida.
  - `admin`: Puede hacer `SELECT` y `UPDATE`.
- **Tabla `audit_counts`** (CREARLA):
  - `id` (UUID), `session_id`, `product_id`, `expected_stock` (teórico), `counted_stock` (físico), `difference`, `evidence_photo_url`.
  - `employee`: Puede hacer `INSERT`, pero **TIENE PROHIBIDO HACER SELECT**. El empleado avienta el dato al servidor y se olvida de él. **MUY IMPORTANTE:** El `expected_stock` y `difference` debe ser llenado automáticamente por un Trigger de Base de Datos al hacer el insert, NO enviado por el Frontend (porque el frontend del empleado no debe saber el stock).
  - `admin`: Puede hacer `SELECT`.

## 3. Storage Bucket para Evidencias
- Crea un bucket en Supabase Storage llamado `evidence`.
- **Configuración:** No debe ser público. 
- **Políticas RLS de Storage:**
  - `employee`: Solo puede hacer `INSERT` (subir foto).
  - `admin`: Puede hacer `SELECT` (ver foto).

## 4. Triggers Necesarios
- **Cálculo de Diferencias:** Cuando se inserta un registro en `audit_counts`, un trigger (función de Postgres) debe ir a consultar silenciosamente `branch_inventory` (saltándose el RLS del usuario actual usando `SECURITY DEFINER`), traer el `current_stock`, guardarlo en `expected_stock`, y calcular la `difference = counted_stock - expected_stock`.

---
**Nota:** Avísame cuando la estructura de las tablas esté montada en la BD para poder enganchar las consultas 404 que actualmente está tirando el frontend de Auditoría.
