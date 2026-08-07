# Public Read Policies Tracking

## Objetivo

Habilitar temporalmente el acceso de lectura para el frontend mientras el módulo de autenticación aún no se encuentra implementado.

---

# Políticas agregadas

Se habilitó acceso público (`anon`) para lectura en las siguientes tablas:

- branches
- catalog_types
- catalog_values
- products
- branch_inventory
- inventory_movements

Adicionalmente se permitió temporalmente:

- INSERT en branch_inventory
- UPDATE en branch_inventory
- INSERT en inventory_movements

Esto permite al frontend consultar catálogos, productos e inventario durante la etapa de desarrollo.

---

# Estado de RLS

Row Level Security permanece habilitado en todas las tablas.

No se deshabilitó RLS.

Únicamente se agregaron políticas que permiten operaciones específicas.

---

# Consideraciones

Estas políticas son temporales y existen únicamente para facilitar el desarrollo del frontend.

Una vez implementada la autenticación mediante Supabase Auth deberán reemplazarse por políticas basadas en:

- auth.uid()
- current_profile()
- current_branch()
- current_organization()
- has_role()
- is_admin()

---

# Observaciones

Actualmente existen dos políticas de lectura para `branch_inventory`:

- branch_inventory_select_policy
- Permitir lectura publica de inventario por sucursal

Ambas funcionan correctamente durante el desarrollo.

Cuando el sistema migre a autenticación completa deberá eliminarse la política pública y mantenerse únicamente la política basada en perfiles y sucursales.

---

# Estado

✅ Assignment 009 completada.

El frontend puede consumir la información necesaria durante el desarrollo sin deshabilitar Row Level Security.