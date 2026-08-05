# Restricción de Licenciamiento (Límite de Sucursales)

Ángel, necesito que implementes una restricción a nivel de base de datos para controlar el licenciamiento de nuestro SaaS.

## Requerimiento
Actualmente estamos vendiendo la licencia que permite un **máximo de 2 sucursales** por organización. Si una organización intenta registrar una tercera sucursal, la base de datos debe rechazar la transacción para evitar saltarse la validación del frontend.

## Implementación solicitada
Por favor, crea una función y un trigger en la tabla `branches` que valide esto antes de hacer un `INSERT`.

Guarda el siguiente script en `Supabase/schema/triggers/business/001-branch_license_limit.sql` (recuerda hacer commit y push):

```sql
CREATE OR REPLACE FUNCTION public.check_branch_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    branch_count INT;
BEGIN
    -- Contar cuántas sucursales tiene actualmente la organización
    SELECT COUNT(*) INTO branch_count 
    FROM public.branches 
    WHERE organization_id = NEW.organization_id;

    -- Si ya tiene 2 o más, rechazar el insert
    IF branch_count >= 2 THEN
        RAISE EXCEPTION 'LICENSE_LIMIT_REACHED: Tu licencia actual solo permite un máximo de 2 sucursales. Contacta a soporte para aumentar tu plan.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_branch_limit
BEFORE INSERT ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.check_branch_limit();
```

Yo ya implementé en el frontend un modal bonito que detiene al usuario antes de guardar, pero necesito esta capa de seguridad en backend para evitar inyecciones directas a la API. ¡Gracias!
