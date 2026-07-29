# Catalogs Design

---

# Descripción

Este documento define el módulo de Catálogos del ERP.

Su objetivo es centralizar toda la información de referencia utilizada por los demás módulos del sistema.

Los catálogos contienen datos relativamente estables y reutilizables.

No representan operaciones del negocio.

---

# Objetivos

- Evitar duplicidad de información.
- Estandarizar listas de selección.
- Simplificar el mantenimiento.
- Facilitar futuras integraciones.
- Mantener consistencia entre módulos.

---

# Filosofía

Toda lista reutilizable del sistema deberá convertirse en un catálogo.

No se utilizarán listas "hardcodeadas" en el frontend.

---

# Catálogos del Sistema

## Productos

Agrupa productos por familia.

Ejemplos.

- Bases Original
- Bases Flat
- Coberturas
- Rellenos
- Bebidas
- Insumos

---

## Unidades

Define la unidad de medida.

Ejemplos.

- Pieza
- Caja
- Litro
- Kilogramo
- Bolsa

---

## Sabores

Representa los sabores disponibles.

Ejemplos.

- Chocolate
- Fresa
- Mora
- Coco
- Yogurt Griego
- Pistache

---

## Tipos de Paleta

Ejemplos.

- Original
- Flat
- Especial

---

## Turnos

Representa el turno operativo.

Ejemplos.

- Matutino
- Vespertino
- Nocturno

---

## Métodos de Pago

Ejemplos.

- Efectivo
- Tarjeta
- Transferencia
- Mercado Pago

---

## Categorías de Gasto

Ejemplos.

- Insumos
- Limpieza
- Papelería
- Mantenimiento
- Servicios

---

## Establecimientos

Representa el lugar donde se realizó un gasto.

Ejemplos.

- Office Depot
- Chedraui
- Costco
- Sam's

---

## Proveedores

Empresas que abastecen productos.

Ejemplos.

- Kekala
- Coca Cola
- Sabritas

---

# Reutilización

Los catálogos serán utilizados por múltiples módulos.

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
```

---

# Reglas

Los catálogos:

- pueden activarse o desactivarse.
- no deberán eliminarse físicamente.
- podrán utilizarse como filtros.
- podrán utilizarse para validaciones.
- deberán poder ordenarse.

---

# Beneficios

Centralizar los catálogos permitirá:

- Menos duplicidad.
- Mayor consistencia.
- Mejor experiencia de usuario.
- Reportes uniformes.
- Integraciones más simples.

---

# Estado

Documento aprobado.

Los catálogos serán implementados como tablas independientes dentro del módulo Catalogs.