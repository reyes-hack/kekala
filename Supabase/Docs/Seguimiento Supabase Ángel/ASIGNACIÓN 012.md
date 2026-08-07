# JWT Security Architecture

## Objetivo

Migrar la autorización del ERP desde funciones que consultaban tablas (`profiles`, `profile_roles`, `roles`) hacia una arquitectura basada en JWT firmado mediante Supabase Auth Hooks.

---

# Arquitectura

El flujo de autenticación queda definido de la siguiente forma:

Usuario

↓

Supabase Auth

↓

custom_access_token_hook()

↓

JWT

↓

RLS

↓

Acceso a Base de Datos

---

# JWT Claims

Durante la autenticación se inyectan automáticamente los siguientes datos dentro del JWT:

- organization_id
- branch_id
- roles

Estos valores son obtenidos directamente desde la estructura existente:

- profiles
- profile_roles
- roles

No fue necesario crear una tabla adicional (`user_roles`), evitando duplicidad de información y manteniendo una única fuente de verdad para la autorización.

---

# Funciones auxiliares

Se incorporaron los siguientes helpers para simplificar las políticas RLS:

- jwt_organization_id()
- jwt_branch_id()
- has_jwt_role()
- is_jwt_admin()

Estas funciones encapsulan el acceso al JWT y permiten escribir políticas más legibles y mantenibles.

---

# Políticas RLS

Se migraron las principales políticas para utilizar los datos contenidos en el JWT en lugar de realizar consultas adicionales a tablas.

Las tablas migradas incluyen:

- profiles
- branch_inventory
- sales
- purchase_orders
- expenses
- waste_records
- transfer_orders
- inventory_movements

Las políticas públicas utilizadas durante el desarrollo permanecen activas temporalmente para no afectar el funcionamiento del frontend mientras la autenticación completa es implementada.

---

# Storage

Se creó el bucket:

- evidence

Políticas aplicadas:

- SELECT público.
- INSERT únicamente para usuarios autenticados.

Este bucket será utilizado para almacenar fotografías y documentos relacionados con auditorías, gastos y demás evidencias operativas.

---

# Estado

✅ Arquitectura JWT implementada.

El ERP queda preparado para utilizar autenticación basada en Supabase Auth, JWT firmado y políticas RLS apoyadas en los claims del token.