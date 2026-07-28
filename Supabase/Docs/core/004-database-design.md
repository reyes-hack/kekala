# Core Database Design


# Descripción

Este documento define el diseño físico del módulo Core.

Su propósito es establecer las convenciones, estructuras y lineamientos que se utilizarán para implementar el esquema en Supabase.

Una vez aprobado este documento, podrá iniciarse la creación de las tablas del Core.

---

# Objetivo

Garantizar que todas las tablas del proyecto mantengan una estructura consistente.

Este documento define:

- Convenciones
- Tipos de datos
- Relaciones
- Auditoría
- Seguridad
- Organización del esquema

---

# Filosofía

El esquema deberá ser:

- Simple
- Consistente
- Escalable
- Auditable
- Fácil de mantener

Las decisiones tomadas en este documento deberán respetarse durante todo el proyecto.

---

# Convenciones Generales

## Primary Keys

Todas las tablas utilizarán UUID.

```sql
id UUID PRIMARY KEY
```

Nunca se utilizarán IDs autoincrementales.

---

## Foreign Keys

Todas las relaciones utilizarán UUID.

Ejemplo.

```
organization_id

branch_id

profile_id

role_id
```

---

## Nombres

Todas las tablas utilizarán:

- inglés
- minúsculas
- snake_case

Ejemplos.

```
organizations

branches

profiles

roles

permissions
```

---

## Columnas de Auditoría

Todas las tablas deberán incluir.

```sql
created_at

updated_at
```

Cuando sea necesario también.

```sql
created_by

updated_by
```

---

## Soft Delete

No se utilizará una política global de Soft Delete.

Cada módulo decidirá si necesita conservar registros inactivos.

En el Core se preferirá utilizar un campo:

```sql
is_active BOOLEAN
```

para representar el estado operativo de entidades como sucursales, usuarios o roles.

---

# Organización del Esquema

El proyecto utilizará únicamente el esquema:

```
public
```

La lógica de negocio estará encapsulada mediante funciones SQL.

---

# Integración con Supabase Auth

La autenticación será administrada por:

```
auth.users
```

El módulo Core únicamente almacenará información administrativa.

```
auth.users

↓

profiles
```

La tabla `profiles` extenderá la información del usuario autenticado.

---

# Relaciones

El Core utilizará los siguientes tipos de relaciones.

## Uno a Muchos

```
Organization

↓

Branches
```

---

```
Branch

↓

Profiles
```

---

## Muchos a Muchos

```
Profiles

↓

Roles
```

mediante una tabla intermedia.

---

```
Roles

↓

Permissions
```

mediante otra tabla intermedia.

---

# Catálogos

Se consideran tablas de catálogo aquellas cuyo contenido cambia muy poco.

Ejemplos.

```
roles

permissions
```

Estas tablas serán inicializadas mediante Seeds.

---

# Tablas Operativas

Se consideran operativas aquellas que contienen información del negocio.

Ejemplos.

```
organizations

branches

profiles
```

---

# Índices

Cada llave foránea deberá tener un índice.

También se crearán índices para campos de búsqueda frecuente.

Ejemplos.

```
email

code

name

is_active
```

---

# Restricciones

Siempre que sea posible se utilizarán restricciones a nivel base de datos.

Ejemplos.

- UNIQUE
- CHECK
- FOREIGN KEY
- NOT NULL

Las reglas críticas no deberán depender únicamente del frontend.

---

# Seguridad

Toda consulta realizada desde el cliente deberá ejecutarse mediante:

- Row Level Security
- Funciones SQL
- Políticas de acceso

El frontend nunca será responsable de validar permisos.

---

# Funciones SQL

Toda operación de negocio deberá implementarse mediante funciones SQL.

Ejemplos.

```
create_branch()

update_branch()

create_profile()

assign_role()

remove_role()
```

Las aplicaciones cliente nunca modificarán directamente las tablas para ejecutar procesos de negocio.

---

# Organización del Proyecto

```
schema/

    enums/

    tables/

    indexes/

    triggers/

    functions/

        core/

    policies/

    seeds/
```

Cada componente tendrá un archivo independiente.

---

# Convención de Archivos

Las tablas seguirán un orden numérico.

```
001-organizations.sql

002-branches.sql

003-profiles.sql

004-roles.sql

005-permissions.sql

006-profile_roles.sql

007-role_permissions.sql
```

Los índices, triggers, funciones y políticas seguirán la misma organización.

---

# Validación

Cada tabla deberá validarse inmediatamente después de su creación.

El flujo será:

```
Crear Tabla

↓

Validar

↓

Crear Relaciones

↓

Validar

↓

Crear Índices

↓

Validar

↓

Crear Funciones

↓

Validar

↓

Documentar
```

No se continuará con la siguiente tabla hasta haber validado completamente la anterior.

---

# Estado

**Documento aprobado.**

Con este documento concluye el diseño del módulo Core y queda autorizada la implementación física del esquema en Supabase.