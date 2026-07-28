# Module Structure

# Descripción

Este documento define la estructura modular del sistema Kekala.

Cada módulo representa un conjunto de funcionalidades relacionadas con un área específica del negocio.

La división modular permite desarrollar, mantener y escalar el sistema de forma organizada, reduciendo el acoplamiento entre componentes y facilitando futuras ampliaciones.

---

# Filosofía

Cada módulo debe cumplir una única responsabilidad.

Los módulos pueden consumir información de otros módulos, pero nunca deberán duplicar lógica de negocio ni almacenar información redundante.

Toda comunicación entre módulos deberá realizarse mediante relaciones bien definidas y funciones SQL.

---

# Arquitectura General

```
                    Kekala ERP

                        │

        ┌───────────────┼────────────────┐

        ▼               ▼                ▼

      Core         Inventory         Sales

        │               │                │

        ├───────────────┼────────────────┤

        ▼               ▼                ▼

    Expenses         Waste        Purchasing

                └───────────────┐

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

# Orden de Desarrollo

Los módulos serán desarrollados respetando sus dependencias.

```
1. Core

↓

2. Inventory

↓

3. Sales

↓

4. Expenses

↓

5. Waste

↓

6. Purchasing

↓

7. Dashboard

↓

8. Reports

↓

9. Integrations
```

Cada módulo deberá encontrarse completamente documentado antes de iniciar el siguiente.

---

# Módulo Core

## Objetivo

Administrar la estructura organizacional del sistema.

## Responsabilidades

- Organización
- Sucursales
- Usuarios
- Roles
- Permisos
- Configuración

## Dependencias

Ninguna.

Todos los módulos dependen del Core.

---

# Módulo Inventory

## Objetivo

Administrar el inventario físico de cada sucursal.

## Responsabilidades

- Productos
- Categorías
- Existencias
- Lotes
- Movimientos
- Almacenes

## Depende de

- Core

---

# Módulo Sales

## Objetivo

Registrar las ventas diarias.

## Responsabilidades

- Ventas
- Tickets
- Métodos de pago
- Reportes diarios
- Indicadores comerciales

## Depende de

- Core
- Inventory

---

# Módulo Expenses

## Objetivo

Registrar los gastos operativos.

## Responsabilidades

- Categorías
- Gastos
- Evidencias
- Historial

## Depende de

- Core

---

# Módulo Waste

## Objetivo

Controlar las mermas del inventario.

## Responsabilidades

- Registro
- Motivos
- Lotes
- Ajustes de inventario

## Depende de

- Core
- Inventory

---

# Módulo Purchasing

## Objetivo

Administrar el proceso de abastecimiento.

## Responsabilidades

- Proveedores
- Órdenes de compra
- Recepción
- Actualización de inventario

## Depende de

- Core
- Inventory

---

# Módulo Dashboard

## Objetivo

Concentrar los indicadores ejecutivos del sistema.

## Información Consumida

- Ventas
- Gastos
- Inventario
- Compras
- Mermas

## Información Generada

- KPIs
- Indicadores
- Comparativos
- Gráficas

---

# Módulo Reports

## Objetivo

Generar reportes históricos.

## Reportes

- Diario
- Semanal
- Mensual
- Anual
- Personalizado

---

# Módulo Integrations

## Objetivo

Conectar sistemas externos con Kekala.

## Integraciones Iniciales

- Foodbot

## Futuras Integraciones

- Sistemas contables
- APIs externas
- Exportaciones
- ERP externos

---

# Dependencias

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

Todos los módulos dependen del Core.

Ningún módulo puede existir sin una sucursal.

---

# Organización del Código

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

        core/

        inventory/

        sales/

        expenses/

        waste/

        purchasing/

        dashboard/

        reports/

        integrations/

    policies/

    seeds/
```

---

# Metodología por Módulo

Cada módulo seguirá exactamente el mismo flujo de trabajo.

```
1. Diseño Funcional

↓

2. Documentación

↓

3. Modelo de Datos

↓

4. Tablas SQL

↓

5. Índices

↓

6. Triggers

↓

7. Funciones SQL

↓

8. Validación

↓

9. Documentación Final
```

No se desarrollarán funciones SQL sin haber completado previamente el diseño del módulo.

---

# Estado del Proyecto

| Módulo | Estado |
|----------|---------|
| Core | Pendiente |
| Inventory | Pendiente |
| Sales | Pendiente |
| Expenses | Pendiente |
| Waste | Pendiente |
| Purchasing | Pendiente |
| Dashboard | Pendiente |
| Reports | Pendiente |
| Integrations | Pendiente |

---

# Próxima Etapa

Con la aprobación de este documento concluye la fase de arquitectura del proyecto.

La siguiente fase corresponde al diseño del **Core**, comenzando con la definición de las entidades organizacionales y posteriormente con la implementación del esquema en Supabase.