# Products Domain Design

## Objetivo

Definir el modelo de dominio para los productos de Kekala.

Este documento establece las reglas de negocio antes de crear cualquier tabla relacionada con productos, inventario, compras y ventas.

---

# Principios

Un producto representa un artículo comercializable por la empresa.

El modelo debe ser:

- Normalizado
- Flexible
- Escalable
- Independiente del frontend
- Independiente del POS

---

# Objetivos

El modelo debe soportar:

- Inventario
- Compras
- Ventas
- Costos
- Mermas
- Reportes
- Dashboard
- Integraciones futuras

sin modificaciones estructurales importantes.

---

# Qué NO es un producto

No es un movimiento.

No es un inventario.

No es una venta.

No es una compra.

No es una receta.

Todas esas entidades referencian un producto.

---

# Preguntas que debe responder el modelo

¿Qué producto se vende?

¿Qué producto se compra?

¿Qué producto tiene inventario?

¿Qué producto genera merma?

¿Cuánto cuesta?

¿Cuánto se vende?

¿Cuánto existe?

---

# Catálogos utilizados

El producto utilizará los siguientes catálogos:

- PRODUCT_CATEGORY
- UNIT

Y posiblemente:

- PALETA_TYPE
- FLAVOR

dependiendo del diseño final.

---

# Producto vs Variante

Antes de construir las tablas debemos responder:

¿Existe un producto único llamado:

Especial

o existen dos productos:

Especial Original

Especial Flat

Esta decisión cambia completamente el modelo.

---

# Alternativa A

Producto único

Especial

↓

Variantes

- Original
- Flat

Ventajas

- Modelo más normalizado
- Menos duplicidad
- Más flexible

Desventajas

- Más complejo

---

# Alternativa B

Cada combinación es un producto

Especial Original

Especial Flat

Turbo Original

Turbo Flat

Tradicional Original

Tradicional Flat

Ventajas

- Muy simple
- Fácil de consultar
- Fácil para POS

Desventajas

- Duplica información

---

# Pregunta importante

¿Qué vende realmente el cliente?

Si en el POS aparece:

Especial Original

como producto independiente,

entonces probablemente sea un producto.

No una variante.

---

# Mi hipótesis

Después de revisar la documentación del cliente, considero que:

Especial Original

Especial Flat

Tradicional Original

Turbo Flat

deberían modelarse como productos independientes.

No como variantes.

La razón es que:

- poseen precio propio
- poseen inventario propio
- poseen ventas propias
- aparecen individualmente en reportes

Esto simplifica enormemente el ERP.

---

# Modelo preliminar

products

- id
- organization_id
- product_code
- name
- description

- category_id

- unit_id

- barcode

- sku

- sale_price

- purchase_price

- minimum_stock

- maximum_stock

- is_active

- created_at

- updated_at

---

# Lo que NO irá en Products

Inventario

Existencias

Entradas

Salidas

Compras

Ventas

Recetas

Mermas

---

# Futuras tablas

products

↓

inventory

↓

purchase_items

↓

sale_items

↓

waste_items

Todas apuntarán al mismo producto.

---

# Decisiones tomadas

✅ Un producto representa una unidad comercial.

✅ Un producto puede venderse.

✅ Un producto puede comprarse.

✅ Un producto puede inventariarse.

✅ Un producto nunca representa una transacción.

---

# Pendientes

Antes de crear products debemos responder:

¿Necesitamos sabores?

¿Necesitamos tipo de paleta?

¿Necesitamos variantes?

¿Necesitamos recetas?

Estas respuestas definirán la estructura final del módulo Inventory.