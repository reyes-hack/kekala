# Domain Model


# Descripción

Este documento define el modelo de dominio del sistema Kekala.

Su propósito es identificar las entidades principales del negocio y las relaciones que existen entre ellas antes de comenzar el diseño del modelo de datos.

El modelo de dominio representa el funcionamiento real de la empresa, independientemente de la tecnología utilizada para implementarlo.

---

# Filosofía

El sistema no se construye alrededor del inventario.

El sistema no se construye alrededor de las ventas.

El sistema no se construye alrededor de los productos.

El sistema se construye alrededor de la **Sucursal**.

Toda operación del negocio pertenece a una sucursal.

La sucursal representa la unidad principal de operación dentro del sistema.

---

# Dominio General

```
Organization

        │

        ▼

Branches

        │

        ├───────────────┐

        ▼               ▼

Users         Inventory

        │               │

        ▼               ▼

Expenses      Sales

        │               │

        └───────┬───────┘

                ▼

             Waste

                ▼

          Purchasing

                ▼

           Dashboard
```

---

# Entidades Principales

El sistema está compuesto por las siguientes entidades de negocio.

---

# Organization

Representa la empresa propietaria del sistema.

Responsabilidades:

- Configuración general
- Información fiscal
- Moneda principal
- Parámetros globales
- Datos corporativos

Relaciones:

```
Organization

↓

Branches
```

---

# Branch

Representa una sucursal física.

Es la entidad más importante del sistema.

Toda operación pertenece a una sucursal.

Responsabilidades:

- Operación diaria
- Inventario
- Ventas
- Gastos
- Mermas
- Compras
- Usuarios

Relaciones

```
Branch

├── Users

├── Inventory

├── Sales

├── Expenses

├── Waste

└── Purchasing
```

---

# User

Representa un empleado del sistema.

Cada usuario pertenece a una sucursal.

Un usuario podrá tener uno o varios roles.

Responsabilidades

- Acceso al sistema
- Captura de información
- Operación diaria

---

# Role

Define los permisos disponibles dentro del sistema.

Ejemplos:

- Administrador
- Gerente
- Supervisor
- Cajero
- Inventarios

Los permisos nunca estarán definidos directamente en el usuario.

Siempre serán asignados mediante Roles.

---

# Inventory

Representa el inventario disponible dentro de una sucursal.

Incluye:

- productos
- existencias
- movimientos
- lotes
- almacenes

Todo movimiento de inventario deberá generar un historial.

---

# Product

Representa un artículo comercializado por la empresa.

Ejemplos:

- Caja Original
- Caja Flat
- Paleta Individual

Cada producto podrá pertenecer a diferentes categorías.

---

# Lot

Representa un lote de fabricación.

Los lotes permiten:

- trazabilidad
- reclamaciones
- control de mermas
- seguimiento de inventario

Un mismo producto puede existir en diferentes lotes.

---

# Sale

Representa una venta realizada por una sucursal.

Una venta registra:

- fecha
- monto
- forma de pago
- tickets
- promociones
- modificadores

Las ventas alimentan directamente los indicadores financieros.

---

# Expense

Representa un gasto operativo.

Ejemplos:

- Gasolina
- Limpieza
- Papelería
- Mantenimiento
- Compras menores

Cada gasto pertenece a una categoría.

---

# Waste

Representa una merma.

Toda merma debe indicar:

- producto
- lote
- motivo
- cantidad
- sucursal
- usuario

La merma siempre afecta el inventario.

---

# Purchasing

Representa el proceso de abastecimiento.

Incluye:

- proveedores
- órdenes de compra
- recepción
- actualización de inventario

Las compras incrementan las existencias del inventario.

---

# Dashboard

No almacena información.

Su función consiste en consolidar información proveniente de todos los módulos.

Ejemplos:

- ventas
- gastos
- utilidad
- ticket promedio
- rotación
- mermas
- inventario

---

# Reports

Representa la capa analítica del sistema.

Toda la información será obtenida mediante consultas.

Nunca almacenará información duplicada.

---

# Integrations

Representa las conexiones con sistemas externos.

Inicialmente contempla:

- Foodbot

En el futuro podrán agregarse nuevos proveedores sin modificar el resto del sistema.

---

# Relaciones del Dominio

```
Organization

    │

    ▼

Branch

    │

    ├─────────────┬───────────────┬─────────────┐

    ▼             ▼               ▼             ▼

Users      Inventory         Sales       Expenses

                 │               │

                 ▼               ▼

              Products       Dashboard

                 │

                 ▼

               Lots

                 │

                 ▼

              Waste

                 │

                 ▼

           Purchasing
```

---

# Dependencias

Las dependencias entre módulos serán unidireccionales.

```
Core

↓

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

↓

Reports

↓

Integrations
```

Los módulos superiores nunca dependerán de módulos inferiores.

---

# Reglas de Negocio

## Organización

Una organización puede administrar múltiples sucursales.

---

## Sucursal

Toda operación pertenece a una sucursal.

No existirán registros huérfanos.

---

## Usuario

Todo usuario pertenece a una sucursal.

Todo usuario deberá tener al menos un rol.

---

## Inventario

Todo movimiento modifica existencias.

Todo movimiento genera historial.

---

## Ventas

Toda venta pertenece a una sucursal.

Toda venta actualiza indicadores.

---

## Gastos

Todo gasto pertenece a una categoría.

Todo gasto pertenece a una sucursal.

---

## Mermas

Toda merma disminuye inventario.

Toda merma pertenece a un lote.

Toda merma registra un motivo.

---

## Compras

Toda compra incrementa inventario.

Toda compra pertenece a un proveedor.

---

## Dashboard

Nunca captura información.

Solo consume información existente.

---

# Principios del Modelo

- Una sola fuente de verdad para cada dato.
- No duplicar información.
- Relaciones explícitas.
- Módulos desacoplados.
- Escalabilidad.
- Trazabilidad completa.
- Historial de operaciones.
- Auditoría de cambios.

---

# Resultado Esperado

Al finalizar el desarrollo, todos los módulos del sistema deberán integrarse a través de este modelo de dominio, garantizando una arquitectura consistente, mantenible y escalable.

Este documento servirá como referencia principal para el diseño del modelo de datos en Supabase y para la implementación de las funciones SQL que compondrán la lógica de negocio del sistema.