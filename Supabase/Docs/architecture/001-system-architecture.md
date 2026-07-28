# System Architecture
---

# Descripción

Este documento define la arquitectura general del sistema desarrollado para **Kekala**.

Su objetivo es establecer la estructura principal del proyecto antes del desarrollo del modelo de datos y de los diferentes módulos funcionales.

La arquitectura propuesta busca mantener una plataforma organizada, escalable y modular, permitiendo que cada componente del sistema tenga responsabilidades claramente definidas y una integración consistente con el resto de la aplicación.

---

# Objetivo del Sistema

Desarrollar una plataforma empresarial que permita centralizar la operación administrativa y financiera de Kekala, integrando en un solo sistema los procesos relacionados con:

- Administración de sucursales
- Control de inventario
- Registro de ventas
- Registro de gastos
- Control de mermas
- Compras
- Indicadores financieros
- Dashboard ejecutivo
- Integraciones con sistemas externos

---

# Principios de Arquitectura

El sistema será desarrollado bajo los siguientes principios.

## Modularidad

Cada área del negocio será implementada como un módulo independiente.

Cada módulo tendrá:

- sus tablas
- sus funciones
- su documentación
- sus validaciones

Esto permitirá mantener una separación clara entre responsabilidades.

---

## Centralización

Toda la información deberá almacenarse en una única base de datos.

Los módulos compartirán información mediante relaciones controladas, evitando duplicidad de datos.

---

## Escalabilidad

La arquitectura deberá permitir incorporar nuevos módulos sin afectar el funcionamiento de los existentes.

El crecimiento del sistema deberá realizarse mediante la incorporación de nuevos componentes y no mediante modificaciones importantes al núcleo de la aplicación.

---

## Reutilización

Siempre que sea posible, los módulos deberán reutilizar componentes existentes.

La lógica común deberá implementarse una sola vez.

---

## Separación entre Lectura y Escritura

Las operaciones del sistema estarán divididas en dos capas:

### Transaction Layer

Responsable de modificar la información.

Ejemplos:

- registrar venta
- registrar gasto
- registrar merma
- actualizar inventario

---

### Query Layer

Responsable únicamente de consultar información.

Ejemplos:

- dashboard
- reportes
- indicadores
- consultas administrativas

---

# Dominio Principal

El sistema estará construido alrededor de la **Sucursal**.

Toda la operación administrativa dependerá de ella.

```
Sucursal

    │

    ├───────────────┐

    ▼               ▼

Inventario      Ventas

    │               │

    ▼               ▼

Mermas         Gastos

    │               │

    └─────────┬─────┘

              ▼

        Dashboard
```

Cada registro operativo pertenecerá a una sucursal.

---

# Organización General

El proyecto estará dividido en módulos independientes.

```
Kekala ERP

│

├── Core

├── Inventory

├── Sales

├── Expenses

├── Waste

├── Purchasing

├── Dashboard

├── Reports

└── Integrations
```

Cada módulo tendrá su propio conjunto de tablas, funciones y documentación.

---

# Core

El módulo Core representa el núcleo del sistema.

Será responsable de administrar:

- organización
- sucursales
- usuarios
- roles
- permisos
- configuración

Todos los demás módulos dependerán del Core.

---

# Inventory

Responsable del control de existencias.

Incluye:

- productos
- almacenes
- movimientos
- inventario
- lotes
- existencias

---

# Sales

Responsable del registro de ventas.

Incluye:

- ventas diarias
- reportes
- tickets
- indicadores comerciales

---

# Expenses

Responsable del registro y clasificación de gastos.

Incluye:

- categorías
- conceptos
- historial
- reportes financieros

---

# Waste

Responsable del control de mermas.

Incluye:

- registro de mermas
- motivos
- lotes
- afectación al inventario

---

# Purchasing

Responsable de la administración de compras.

Incluye:

- órdenes de compra
- recepción
- abastecimiento
- proveedores

---

# Dashboard

Responsable de consolidar la información de todos los módulos.

Incluye:

- indicadores
- gráficas
- reportes ejecutivos
- análisis financiero

---

# Reports

Responsable de generar información histórica.

Incluye reportes por:

- día
- semana
- mes
- año
- periodos personalizados

---

# Integrations

Responsable de la comunicación con servicios externos.

Inicialmente contempla:

- Foodbot
- Exportaciones
- APIs futuras

Las integraciones nunca accederán directamente a las tablas del sistema.

Toda la comunicación deberá realizarse mediante funciones y servicios definidos por la plataforma.

---

# Arquitectura General

```
                        Kekala ERP

                         Core
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   Inventory            Sales           Expenses
        │                  │                  │
        └──────────────┬───┴──────────────────┘
                       ▼
                    Waste
                       │
                       ▼
                  Purchasing
                       │
                       ▼
                   Dashboard
                       │
                       ▼
                    Reports
                       │
                       ▼
                  Integrations
```

---

# Metodología de Desarrollo

Cada módulo seguirá el mismo proceso de construcción.

```
Análisis

↓

Arquitectura

↓

Modelo de Datos

↓

Documentación

↓

Tablas SQL

↓

Funciones SQL

↓

Validación

↓

Documentación Final
```

Ningún módulo comenzará con la implementación de código sin haber sido previamente diseñado y documentado.

---

# Organización del Proyecto

```
docs/

    architecture/

    core/

    inventory/

    sales/

    expenses/

    waste/

    purchasing/

    dashboard/

    reports/

schema/

    enums/

    tables/

    indexes/

    triggers/

    functions/

    policies/

    seeds/
```

Esta estructura permitirá mantener una separación clara entre documentación, modelo de datos y lógica de negocio.

---
