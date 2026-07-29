# ERP Entity Map


# Objetivo

Definir todas las entidades principales que conformarán el ERP de Kekala.

Este documento representa el mapa completo del dominio del negocio y servirá como referencia para el diseño e implementación de todos los módulos del sistema.

No define tablas ni columnas. Define únicamente entidades y sus relaciones.

---

# Filosofía

Cada entidad existe porque representa un proceso real dentro de la operación de Kekala.

No se crearán entidades "por si acaso".

Cada entidad deberá estar respaldada por una necesidad del negocio.

---

# Mapa General

```
Organization
│
└── Branch
    │
    ├── Users
    ├── Inventory
    ├── Sales
    ├── Expenses
    ├── Waste
    ├── Purchasing
    ├── Cash Closing
    └── Dashboard
```

---

# Core

Responsable de la administración del sistema.

## Entidades

- Organization
- Branch
- Profile
- Role
- Permission

---

# Inventory

Responsable del control de existencias.

## Entidades

- Product Category
- Product
- Unit
- Inventory
- Inventory Movement
- Lot

---

# Purchasing

Responsable de abastecer inventario.

## Entidades

- Supplier
- Purchase Order
- Purchase Order Item

---

# Sales

Responsable del registro de ventas.

## Entidades

- Sale
- Sale Item
- Payment
- Payment Method

---

# Cash Closing

Responsable del cierre diario.

## Entidades

- Cash Register
- Cash Closing
- Cash Movement

---

# Expenses

Responsable del registro de gastos.

## Entidades

- Expense
- Expense Category
- Expense Attachment

---

# Waste

Responsable del registro de mermas.

## Entidades

- Waste Record
- Waste Item

---

# Dashboard

No almacena información.

Consume información de:

- Sales
- Inventory
- Expenses
- Waste
- Purchasing

---

# Reports

No almacena información.

Genera información consolidada.

Ejemplos:

- Estado de Resultados
- Inventario
- Compras
- Gastos
- Ventas
- Mermas

---

# Integrations

Responsable de consumir o enviar información a sistemas externos.

## Entidades

- Integration
- Sync Job
- Webhook Log

---

# Relaciones Principales

```
Organization
        │
        ▼
Branch
        │
        ├──────────────┐
        ▼              ▼
Profile          Inventory
        │              │
        ▼              ▼
Roles          Products
        │              │
        ▼              ▼
Permissions     Lots
                       │
                       ▼
                Inventory Movements
                       │
                       ▼
                     Sales
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
    Cash Closing                Expenses
         │                           │
         └─────────────┬─────────────┘
                       ▼
                  Dashboard
```

---

# Entidades Derivadas

Las siguientes entidades NO tendrán tablas propias.

Serán calculadas mediante consultas o funciones SQL.

- KPIs
- Ticket Promedio
- Ventas Netas
- Utilidad
- Estado de Resultados
- Indicadores del Dashboard

---

# Entidades Confirmadas

Este mapa fue construido utilizando:

- Reuniones de levantamiento de requerimientos.
- Propuesta comercial.
- Formatos operativos de Kekala.
- Hojas de control de inventario.
- Hojas de gastos.
- Hojas de mermas.
- Solicitudes de compra.
- Cortes de caja.
- Reportes de ventas.

---

# Estado

Documento aprobado.

Las entidades aquí descritas servirán como guía para el diseño físico de la base de datos y el desarrollo de todos los módulos del ERP.