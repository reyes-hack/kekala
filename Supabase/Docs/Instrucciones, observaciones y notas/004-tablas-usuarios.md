# ASIGNACIÓN 004: Core Organizacional (Sucursales y Perfiles)

Necesitamos la columna vertebral organizacional de Kekala. Todo el sistema ocurre en un lugar físico y es ejecutado por alguien. Para lograr eso, necesitamos materializar el módulo "Core" de tu mapa de entidades.

## Requerimientos y Diseño Sugerido

### 1. Tabla `branches` (Sucursales)
Ya la mencionamos varias veces como FK, pero ahora hay que hacerla oficial.
- `id` (UUID - PK)
- `code` (VARCHAR - Unique) - Ejemplo: `AMERICAS_VER`
- `name` (VARCHAR) - Ejemplo: `Américas Veracruz`
- `address` (TEXT)
- `is_active` (Boolean) - Default `true`

### 2. Tabla `profiles` (Usuarios)
Supabase Auth ya nos da una tabla oculta de usuarios (`auth.users`), pero por regla general en Supabase nunca la tocamos. Necesitamos crear nuestra tabla pública `profiles` que esté linkeada 1-a-1 con Auth.
- `id` (UUID - PK y FK directa a `auth.users(id)`)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `role_id` (UUID - FK a una tabla de roles, o puedes usar un Enum directo si prefieres mantenerlo simple al inicio)
- `branch_id` (UUID opcional - FK a `branches`. A qué sucursal pertenece el empleado. Los administradores pueden tener esto en null).

### 3. Row Level Security (RLS) - Nivel 1
Esta es tu especialidad. Necesito que habilites RLS en las tablas que has creado y crees un par de políticas básicas.
- **Profiles:** Un usuario solo puede actualizar su propio perfil.
- **Inventory:** (De la Asignación 003) Un empleado normal solo debería poder hacer `SELECT` al inventario donde su `profile.branch_id == inventory.branch_id`. Un administrador (define un rol admin) puede ver todas.

## ⚠️ REGLAS OBLIGATORIAS

Para cerrar con broche de oro:
1. **Respaldar en Git**: Scripts SQL de las tablas y sobre todo las **Policies (RLS)** guárdalas en `Supabase/schema/`.
2. **Commit y Push**: Sube tus cambios: `feat(db): modulo core, perfiles, sucursales y RLS inicial`.
3. **Tracking**: Documenta en `Supabase/Docs/Seguimiento Supabase (Ángel)/` cómo configuraste la relación con `auth.users` y cualquier política de seguridad importante a tener en cuenta para cuando yo consuma la API desde el Frontend.
