# Core Business Rules

# Descripción

Este documento define las reglas de negocio del módulo Core.

Las reglas aquí descritas representan el comportamiento esperado del sistema independientemente de la implementación técnica.

Toda funcionalidad desarrollada deberá respetar estas reglas.

---

# Objetivo

Establecer las políticas operativas que gobernarán la administración de:

- Organización
- Sucursales
- Usuarios
- Roles
- Permisos

Estas reglas servirán como base para el diseño del modelo de datos, las funciones SQL y las políticas de seguridad (RLS).

---

# Organización

## Regla 1

Debe existir al menos una organización.

---

## Regla 2

Toda sucursal pertenece obligatoriamente a una organización.

---

## Regla 3

La organización almacena únicamente información corporativa.

No participa directamente en la operación diaria.

---

# Sucursales

La sucursal representa la unidad operativa principal del sistema.

Toda la información del negocio deberá pertenecer a una sucursal.

---

## Regla 1

Una sucursal puede operar de forma independiente.

---

## Regla 2

Cada sucursal tendrá su propio:

- inventario
- ventas
- gastos
- compras
- mermas
- usuarios

---

## Regla 3

Las operaciones nunca podrán registrarse sin una sucursal.

---

## Regla 4

Una sucursal podrá activarse o desactivarse.

Las sucursales desactivadas conservarán su información histórica.

---

# Usuarios

Los usuarios representan personas autorizadas para utilizar el sistema.

---

## Regla 1

Todo usuario pertenece a una sucursal.

---

## Regla 2

Todo usuario debe estar activo para acceder al sistema.

---

## Regla 3

Todo usuario debe quedar registrado como responsable de las operaciones que realice.

---

## Regla 4

Los usuarios nunca eliminarán información crítica.

Las operaciones deberán mantenerse para efectos de auditoría.

---

# Roles

Los roles representan funciones laborales.

Ejemplos:

- Administrador
- Gerente
- Supervisor
- Cajero
- Inventarios

---

## Regla 1

Un usuario puede tener múltiples roles.

---

## Regla 2

Un rol puede pertenecer a múltiples usuarios.

---

## Regla 3

Los roles agrupan permisos.

Nunca almacenan información operativa.

---

# Permisos

Los permisos representan acciones específicas dentro del sistema.

Ejemplos:

- Crear venta
- Registrar gasto
- Registrar merma
- Editar inventario
- Crear orden de compra
- Consultar dashboard

---

## Regla 1

Los permisos nunca se asignan directamente a un usuario.

---

## Regla 2

Los permisos siempre serán heredados mediante roles.

---

## Regla 3

Un permiso puede pertenecer a múltiples roles.

---

# Acceso a la Información

El acceso deberá controlarse mediante la combinación de:

- Usuario
- Rol
- Permisos
- Sucursal

---

## Administrador

Puede acceder a toda la información del sistema.

Sin restricciones de sucursal.

---

## Gerente

Puede administrar la información de una o varias sucursales asignadas.

---

## Supervisor

Puede consultar y registrar operaciones dentro de su sucursal.

No podrá modificar configuraciones generales.

---

## Cajero

Puede registrar operaciones relacionadas con ventas.

No podrá acceder a información financiera global.

---

## Inventarios

Puede registrar movimientos de inventario y mermas.

No podrá consultar información financiera.

---

# Auditoría

Toda operación importante deberá registrar:

- Usuario
- Fecha
- Hora
- Sucursal

Cuando aplique también deberá conservar:

- Valor anterior
- Valor nuevo

---

# Eliminación de Información

El sistema privilegiará la conservación del historial.

Siempre que sea posible se utilizarán registros inactivos en lugar de eliminaciones físicas.

---

# Seguridad

Las políticas de Row Level Security deberán garantizar que:

- Los usuarios únicamente consulten información autorizada.
- Las sucursales permanezcan completamente aisladas entre sí.
- Los permisos sean evaluados antes de ejecutar operaciones.

---

# Integridad

Toda información operativa deberá cumplir las siguientes condiciones.

Una venta:

- pertenece a una sucursal
- fue registrada por un usuario

---

Un gasto:

- pertenece a una sucursal
- pertenece a una categoría
- fue registrado por un usuario

---

Una merma:

- pertenece a una sucursal
- pertenece a un lote
- afecta inventario
- fue registrada por un usuario

---

Un movimiento de inventario:

- pertenece a una sucursal
- pertenece a un producto
- fue realizado por un usuario

---

# Principios del Core

El Core deberá garantizar siempre:

- Consistencia
- Integridad
- Auditoría
- Seguridad
- Escalabilidad
- Trazabilidad

---

# Consideraciones Técnicas

La implementación del Core utilizará:

- Supabase Auth para autenticación.
- PostgreSQL como motor de datos.
- Row Level Security (RLS) para aislamiento de información.
- Funciones SQL para encapsular la lógica de negocio.

Las aplicaciones cliente nunca accederán directamente a las tablas para ejecutar procesos de negocio.

Toda operación deberá realizarse mediante funciones SQL.

---

# Estado

**Documento aprobado.**

Las reglas aquí descritas servirán como referencia para el diseño del modelo de datos y para la implementación de las políticas de seguridad del sistema.