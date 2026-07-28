# Core Data Model

# Descripción

Este documento define el modelo de datos lógico del módulo Core.

Su propósito es identificar las entidades principales del sistema, sus atributos, relaciones y responsabilidades antes de comenzar la implementación física en Supabase.

Este documento representa el puente entre el análisis funcional y el diseño de la base de datos.

---

# Objetivos

El modelo de datos del Core deberá permitir:

- Administrar la organización.
- Administrar sucursales.
- Administrar usuarios.
- Administrar roles.
- Administrar permisos.
- Servir como base para todos los demás módulos.

---

# Filosofía

El modelo de datos deberá cumplir los siguientes principios.

- Una única fuente de verdad.
- Relaciones explícitas.
- Sin duplicidad de información.
- Escalable.
- Auditable.
- Compatible con Supabase Auth.
- Preparado para múltiples sucursales.

---

# Entidades del Core

El Core estará compuesto por las siguientes entidades.

```
Organization

↓

Branch

↓

Profile

↓

Role

↓

Permission
```

---

# Organization

Representa la empresa propietaria del sistema.

## Responsabilidad

Almacenar información corporativa.

## Información Principal

- Nombre
- Razón Social
- RFC
- Email
- Teléfono
- Moneda
- Zona Horaria
- Configuración

---

# Branch

Representa una sucursal física.

Es la entidad central del sistema.

Toda operación deberá pertenecer a una sucursal.

## Información Principal

- Organización
- Nombre
- Código
- Dirección
- Ciudad
- Estado
- País
- Teléfono
- Estatus

---

# Profile

Representa la información administrativa del usuario.

La autenticación será administrada por Supabase Auth.

El Profile almacenará únicamente información del negocio.

## Información Principal

- Usuario Auth
- Sucursal
- Nombre
- Apellidos
- Puesto
- Teléfono
- Fotografía
- Estatus

---

# Role

Representa un conjunto de permisos.

Ejemplos.

- Administrador
- Gerente
- Supervisor
- Cajero
- Inventarios

Los Roles no almacenan usuarios.

---

# Permission

Representa una acción específica.

Ejemplos.

```
sales.create

sales.update

sales.delete

inventory.read

inventory.write

expenses.create

dashboard.view
```

---

# Relaciones

## Organization

```
Organization

1

↓

N

Branch
```

---

## Branch

```
Branch

1

↓

N

Profile
```

---

## Profile

```
Profile

N

↓

N

Role
```

---

## Role

```
Role

N

↓

N

Permission
```

---

# Modelo Relacional

```
Organization

        │

        ▼

Branch

        │

        ▼

Profile

        │

        ▼

Profile Roles

        │

        ▼

Roles

        │

        ▼

Role Permissions

        │

        ▼

Permissions
```

---

# Dependencias

El Core no depende de ningún otro módulo.

Todos los módulos utilizarán el Core como referencia.

```
Inventory

↓

Sales

↓

Expenses

↓

Waste

↓

Purchasing

↓

Dashboard
```

Todos consumirán:

- Branch
- Profile

---

# Integración con Supabase

La autenticación será administrada por:

```
auth.users
```

La información administrativa será almacenada en:

```
profiles
```

Esto permite separar claramente:

Autenticación

↓

Supabase

Operación

↓

Core

---

# Modelo de Seguridad

El acceso a la información dependerá de:

```
Usuario

↓

Roles

↓

Permisos

↓

Sucursal
```

Nunca del frontend.

Toda validación deberá realizarse dentro del backend.

---

# Auditoría

Todas las entidades del Core deberán registrar como mínimo.

```
created_at

updated_at
```

Cuando aplique también.

```
created_by

updated_by
```

Las operaciones críticas deberán conservar historial.

---

# Convenciones

Todas las entidades utilizarán:

- UUID como llave primaria.
- Nombres en inglés.
- snake_case.
- Timestamps en UTC.
- Soft Delete cuando sea necesario.

---

# Modelo Conceptual

```
                    Organization

                           │

                           ▼

                      Branches

                           │

            ┌──────────────┼──────────────┐

            ▼              ▼              ▼

        Profiles      Inventory       Sales

            │

            ▼

         Profile Roles

            │

            ▼

           Roles

            │

            ▼

     Role Permissions

            │

            ▼

        Permissions
```

---

# Resultado Esperado

Una vez aprobado este documento se iniciará la implementación física del modelo en Supabase.

Las entidades aquí definidas servirán como base para la creación de:

- Tablas
- Relaciones
- Índices
- Políticas RLS
- Funciones SQL

Todo el desarrollo posterior del sistema dependerá de este modelo de datos.