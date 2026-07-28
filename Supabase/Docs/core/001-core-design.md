# Core Module Design

# Descripción

El módulo **Core** representa el núcleo organizacional del sistema.

Su propósito es administrar la estructura administrativa de Kekala, sirviendo como base para todos los demás módulos del sistema.

Ningún registro operativo podrá existir sin estar asociado previamente al Core.

Todos los módulos dependerán directa o indirectamente de este componente.

---

# Objetivos

El módulo Core tiene como objetivos:

- Definir la estructura organizacional.
- Administrar sucursales.
- Administrar usuarios.
- Administrar roles.
- Controlar permisos.
- Centralizar configuraciones generales.
- Garantizar consistencia entre todos los módulos.

---

# Alcance

El módulo Core será responsable únicamente de la administración organizacional.

No almacenará información relacionada con:

- Inventario
- Ventas
- Gastos
- Compras
- Mermas
- Reportes

Su responsabilidad termina en la administración de la organización y de los usuarios.

---

# Filosofía

Toda operación del sistema deberá responder tres preguntas.

## ¿A qué organización pertenece?

↓

Organization

---

## ¿En qué sucursal ocurrió?

↓

Branch

---

## ¿Quién realizó la operación?

↓

User

---

Si cualquiera de estas respuestas no puede determinarse, la operación será considerada inválida.

---

# Componentes del Core

El módulo estará compuesto por los siguientes dominios.

```
Organization

        │

        ▼

Branch

        │

        ▼

Users

        │

        ▼

Roles

        │

        ▼

Permissions
```

---

# Organización

Representa la empresa propietaria del sistema.

Inicialmente Kekala utilizará una sola organización.

Sin embargo, el diseño permitirá soportar múltiples organizaciones en el futuro.

La organización será responsable de almacenar información corporativa.

Ejemplos:

- Nombre
- Razón Social
- RFC
- Configuración General
- Zona Horaria
- Moneda

---

# Sucursal

La sucursal representa la unidad operativa principal.

Toda la operación del sistema gira alrededor de ella.

Cada sucursal tendrá:

- Inventario
- Usuarios
- Ventas
- Gastos
- Mermas
- Compras

La sucursal será la llave principal de segmentación de la información.

---

# Usuario

Representa un empleado autorizado para utilizar el sistema.

Un usuario podrá acceder únicamente a la información permitida por sus roles y permisos.

Cada usuario pertenecerá a una sucursal.

El usuario será responsable de todas las operaciones registradas en el sistema.

---

# Roles

Los roles representan funciones dentro de la empresa.

Ejemplos.

- Administrador
- Gerente
- Supervisor
- Cajero
- Inventarios

Los roles simplifican la administración de permisos.

---

# Permisos

Los permisos representan acciones específicas.

Ejemplos.

```
Crear Venta

Editar Venta

Eliminar Venta

Registrar Gasto

Editar Inventario

Registrar Merma

Crear Orden de Compra

Ver Dashboard
```

Los permisos nunca serán asignados directamente al usuario.

Siempre serán heredados mediante uno o varios Roles.

---

# Relaciones

```
Organization

    │

    ▼

Branch

    │

    ▼

Users

    │

    ▼

User Roles

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

# Responsabilidades

## Organization

Responsable de:

- Configuración general
- Datos fiscales
- Parámetros globales

---

## Branch

Responsable de:

- Operación diaria
- Segmentación de información
- Administración local

---

## User

Responsable de:

- Autenticación
- Operación
- Auditoría

---

## Role

Responsable de agrupar permisos.

---

## Permission

Responsable de controlar acceso a funcionalidades.

---

# Reglas de Negocio

## Organización

Debe existir al menos una organización.

---

## Sucursales

Toda sucursal pertenece a una organización.

No existirán sucursales sin organización.

---

## Usuarios

Todo usuario pertenece a una sucursal.

Todo usuario debe estar activo para iniciar sesión.

---

## Roles

Un usuario puede tener múltiples roles.

Un rol puede pertenecer a múltiples usuarios.

---

## Permisos

Un rol puede contener múltiples permisos.

Un permiso puede pertenecer a múltiples roles.

---

# Dependencias

El Core no depende de ningún otro módulo.

Todos los demás módulos dependen del Core.

```
Core

├── Inventory

├── Sales

├── Expenses

├── Waste

├── Purchasing

├── Dashboard

├── Reports

└── Integrations
```

---

# Arquitectura del Módulo

```
Core

│

├── Organization

├── Branches

├── Users

├── Roles

└── Permissions
```

Cada componente tendrá su propio conjunto de tablas, funciones y documentación.

---

# Organización del Código

```
docs/

    core/

        001-core-design.md

        002-data-model.md

        003-api-contract.md

schema/

    tables/

    functions/core/

    policies/

    seeds/
```

---

# Próxima Etapa

Con la aprobación de este documento se iniciará el diseño del modelo de datos del módulo Core.

En la siguiente fase se definirán las entidades, atributos y relaciones que posteriormente serán implementados en Supabase.