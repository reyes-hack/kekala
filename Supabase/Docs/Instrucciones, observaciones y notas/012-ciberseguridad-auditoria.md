# Instrucciones Técnicas de Ciberseguridad y Auditoría

Ángel, para cumplir con los requerimientos de la junta y establecer una **ciberseguridad impenetrable** en el módulo de auditorías y el sistema en general, he decidido implementar una arquitectura de seguridad basada en **Auth Hooks y Custom JWT Claims**, junto con un mapeo de correos falsos.

Por favor, ejecuta y configura lo siguiente en el proyecto de Supabase:

## 1. Mapeo de Correos y NIP (Concepto)
En el frontend, he configurado que los empleados ingresen un **Usuario** (ej. `juan`) y un **NIP de 6 dígitos**. Yo me encargo en el frontend de traducirlo a `juan@kekala.internal` para aprovechar el login nativo de Supabase sin que el usuario lo sepa.
**Tu tarea:** Necesito que crees las cuentas de los empleados y administradores desde el panel de Supabase Auth (o vía API) usando este formato de correo falso interno y sus respectivos NIPs de 6 dígitos. Por favor, asegúrate de no activar la confirmación de correo.

## 2. Inyección de Roles en el JWT (Seguridad Criptográfica)
No confío en que el Frontend diga quién es quién. Necesito inyectar el rol del usuario directamente en su token JWT.

Por favor, crea una tabla para asociar roles a los UUID de Auth (guarda este script en `Supabase/schema/tables/security/001-user_roles.sql` y haz commit):
```sql
CREATE TABLE public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'employee'))
);
-- Inserta manualmente los roles de los usuarios que creaste.
```

Y crea el Auth Hook para inyectar el rol en el token (guarda el script en `Supabase/schema/functions/security/004-jwt_role_hook.sql`):
```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    claims jsonb;
    user_role public.user_roles.role%TYPE;
BEGIN
    -- Busca el rol del usuario
    SELECT role INTO user_role FROM public.user_roles WHERE user_id = (event->>'user_id')::uuid;

    claims := event->'claims';

    IF user_role IS NOT NULL THEN
        -- Inyecta el rol en app_metadata
        claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(user_role));
    ELSE
        claims := jsonb_set(claims, '{app_metadata, role}', '"employee"'); -- Por defecto
    END IF;

    -- Actualiza el evento
    event := jsonb_set(event, '{claims}', claims);
    RETURN event;
END;
$$;
```
*Nota: Recuerda asignar este hook en el panel de configuración de Supabase Auth.*

## 3. Políticas RLS Basadas en JWT
A partir de ahora, he decidido que las políticas RLS no consulten tablas externas, sino que lean el token directamente (lo cual es instantáneo e inhackeable).

Necesito que modifiques las políticas actuales y las nuevas bajo este principio (y guardes los cambios en `Supabase/schema/rls/`).

Ejemplo de política para Gastos (Solo Admin):
```sql
CREATE POLICY "Solo admins pueden ver gastos"
ON public.expenses
FOR SELECT
USING ( auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' );
```

Ejemplo para Auditoría Ciega (Empleados pueden insertar, pero no leer el stock):
```sql
CREATE POLICY "Empleados insertan auditoría"
ON public.audit_counts
FOR INSERT
WITH CHECK ( auth.jwt() -> 'app_metadata' ->> 'role' = 'employee' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "Solo admins pueden leer stock teorico"
ON public.branch_inventory
FOR SELECT
USING ( auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' );
```

## 4. Creación del Bucket de Evidencias (Fotos)
Por último, necesito que vayas a **Storage** en el panel de Supabase y crees un nuevo Bucket llamado `evidence`.
Aplícale estas políticas RLS al bucket (y documenta las reglas en `Supabase/schema/rls/storage/`):
- **SELECT:** `true` (Para que el frontend pueda cargar las imágenes públicamente).
- **INSERT:** Solo usuarios autenticados `(auth.role() = 'authenticated')`.

Es crítico que todo script SQL que ejecutes, lo respaldes como archivo en la carpeta `Supabase/schema/` correspondiente en este repositorio de GitHub. No olvides hacer commit y push. ¡Gracias Ángel!
