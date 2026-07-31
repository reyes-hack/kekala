# Core Module Tracking

## Objetivo

Implementar el núcleo organizacional y de seguridad del ERP, proporcionando la estructura base para organizaciones, sucursales, perfiles de usuario, roles y políticas de acceso mediante Row Level Security (RLS).

---

# Arquitectura

El módulo Core se compone de cinco entidades principales:

```
organizations
        │
        │ 1:N
        ▼
branches
        │
        │
        ▼
profiles
        │
        │ N:N
        ▼
profile_roles
        ▲
        │
roles
```

---

# Componentes implementados

## Organizations

Entidad principal del ERP.

Representa una empresa o razón social.

---

## Branches

Representa cada sucursal perteneciente a una organización.

Cada sucursal pertenece únicamente a una organización.

---

## Profiles

Representa el perfil público de cada usuario autenticado mediante Supabase Auth.

Relación:

```
auth.users
      │
      ▼
profiles
```

Cada usuario posee exactamente un perfil.

---

## Roles

Catálogo de roles funcionales del ERP.

Ejemplos:

- OWNER
- ADMIN
- MANAGER
- CASHIER
- INVENTORY
- PURCHASING

Los roles representan capacidades funcionales y no personas ni sucursales.

---

## Profile Roles

Tabla puente que implementa RBAC (Role Based Access Control).

Permite asignar múltiples roles a un mismo usuario.

---

# Framework de Seguridad

Se implementaron funciones reutilizables para centralizar la lógica de seguridad.

## current_profile()

Obtiene el perfil del usuario autenticado.

---

## current_organization()

Obtiene la organización del usuario autenticado.

---

## current_branch()

Obtiene la sucursal asignada al usuario autenticado.

---

## has_role()

Valida si el usuario autenticado posee un rol específico.

---

## is_admin()

Determina si el usuario autenticado posee privilegios administrativos.

---

# Row Level Security

## Profiles

Permisos implementados:

SELECT

- Administradores pueden consultar todos los perfiles.
- Cada usuario puede consultar únicamente su propio perfil.

UPDATE

- Cada usuario únicamente puede modificar su propio perfil.

---

## Branch Inventory

Permisos implementados:

SELECT

- Administradores pueden consultar todas las sucursales.
- Usuarios normales únicamente pueden consultar el inventario correspondiente a su organización y sucursal.

No se implementaron políticas de escritura.

La actualización del inventario ocurre exclusivamente mediante triggers derivados de inventory_movements.

---

# Decisiones de Arquitectura

## Multiempresa

Todas las relaciones críticas utilizan organization_id.

---

## Multisucursal

Cada usuario pertenece opcionalmente a una sucursal.

---

## RBAC

Se implementó un esquema de múltiples roles por usuario.

No se utilizó role_id directo dentro de profiles.

---

## Catálogos

Los roles permanecen desacoplados de las sucursales.

Las sucursales se administran mediante branch_id.

Los permisos mediante profile_roles.

---

## Seguridad

Las políticas RLS utilizan funciones reutilizables.

Se evitó duplicar consultas complejas dentro de cada policy.

---

# Archivos implementados

## Tables

schema/tables/core/

- 001-profiles.sql
- 002-roles.sql
- 003-profile_roles.sql

---

## Indexes

schema/indexes/core/

- 001-profiles.sql
- 002-roles.sql
- 003-profile_roles.sql

---

## Triggers

schema/triggers/core/

- 001-profiles.sql
- 002-roles.sql
- 003-profile_roles.sql

---

## Comments

schema/comments/core/

- 001-profiles.sql
- 002-roles.sql
- 003-profile_roles.sql

---

## Security Functions

schema/functions/security/

- 001-current_profile.sql
- 002-current_organization.sql
- 003-current_branch.sql
- 004-has_role.sql
- 005-is_admin.sql

---

## RLS

schema/rls/core/

- 001-profiles.sql

schema/rls/inventory/

- 001-branch_inventory.sql

---

# Pendientes

- Seeds iniciales de roles.
- Módulo de permisos (permissions).
- Relación role_permissions.
- Auditoría de sesiones.
- MFA.
- Logs de acceso.

---

# Estado

✅ Assignment 004 completada.

El módulo Core queda preparado para soportar el resto del ERP.