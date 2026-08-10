# Asignación 019: Seguridad Absoluta y Prevención de Fuerza Bruta

**Asignado a:** Ángel (Backend & Base de Datos)
**Prioridad:** Alta (Seguridad Crítica)

## Contexto
Hemos detectado que el frontend estaba rebotando a usuarios creados en Auth que no tenían perfil en `public.profiles`. Aunque el frontend ya los expulsa de manera segura (y RLS protege los datos), necesitamos una arquitectura de **Seguridad Absoluta** a nivel backend para castigar a usuarios maliciosos, bots, o curiosos que intenten entrar sin autorización.

## Objetivos de Seguridad a Implementar

### 1. Bloqueo de IPs y Cuentas por Múltiples Intentos (Rate Limiting)
Necesitamos implementar un escudo contra ataques de fuerza bruta.
- **Regla:** Si una IP o un correo electrónico realiza más de **3 intentos fallidos** (contraseña incorrecta o intento de acceso sin tener perfil/rol asignado), el sistema debe bloquear temporalmente el acceso de esa IP y de ese usuario.
- **Solución Propuesta para Ángel:** 
  1. Habilitar la función nativa de Supabase de "Rate Limiting" en el panel de configuración de Auth.
  2. Crear una tabla `auth_audit_logs` para registrar las IPs de los inicios de sesión fallidos.
  3. Crear una Edge Function middleware o usar Cloudflare/WAF frente al dominio para bloquear permanentemente IPs reincidentes.

### 2. Bloqueo en Nivel Base de Datos (Auth Hooks)
Evitemos que usuarios no autorizados siquiera puedan emitir un token válido.
- **Regla:** Un usuario no puede tener una sesión en absoluto si no tiene un `role` válido en el sistema.
- **Solución Propuesta para Ángel:**
  Modificar el **JWT Custom Hook** (`004-jwt_role_hook.sql`) para que, en lugar de solo regresar un arreglo vacío de roles (`[]`), **cancele la emisión del token** y lance un error de Postgres (`RAISE EXCEPTION 'Usuario sin acceso autorizado';`) si el usuario no existe en `public.profile_roles`. Esto destruirá el token antes de que el frontend lo reciba, cortando el problema de raíz en la bóveda de Supabase.

### 3. Alertas Administrativas de Intrusión
- **Regla:** El Administrador debe enterarse si hay actividad sospechosa.
- **Solución Propuesta para Ángel:** 
  Crear un trigger `on_login_failed` o utilizar webhooks de Supabase Auth para insertar un registro en una tabla `security_alerts`. El frontend del Dashboard podrá consumir esta tabla y mostrarle al Admin un globo rojo de notificaciones: *"3 intentos bloqueados hoy desde la IP 189.23.4.1"*.

## Tareas Específicas
- [ ] Configurar el Rate Limiting nativo en el dashboard de Supabase (Max 3 intentos por hora).
- [ ] Modificar el JWT Hook para lanzar una excepción (abortar login) si el usuario no tiene rol.
- [ ] Diseñar el esquema de tablas `security_alerts` y `auth_audit_logs`.
