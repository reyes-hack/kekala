# Foodbot Mappings Synchronization

## Objetivo

Sincronizar la estructura de la tabla `foodbot_mappings` con el desarrollo del frontend y preparar la base de datos para el proceso de deducción automática de inventario a partir de las ventas provenientes de Foodbot.

---

# Tabla implementada

Se verificó la creación de la tabla `foodbot_mappings`.

La tabla permite relacionar un producto recibido desde Foodbot con un producto interno del ERP y definir la cantidad de inventario que debe consumirse por cada venta.

Campos principales:

- foodbot_name
- product_id
- deduction_quantity
- is_active

La estructura incluye:

- Primary Key
- Foreign Key hacia `products`
- Restricciones de integridad
- Índices
- Trigger `updated_at`
- Documentación mediante `COMMENT`

---

# Seguridad (RLS)

Se mantiene habilitado Row Level Security.

Durante la etapa de desarrollo existe una política temporal que permite operaciones sobre la tabla para facilitar la administración de recetas y equivalencias desde el frontend.

Estas políticas deberán sustituirse por permisos basados en autenticación cuando se implemente el módulo de usuarios.

---

# Integración con Inventario

Esta tabla no modifica existencias directamente.

Su propósito es proporcionar la información necesaria para que el backend traduzca una venta de Foodbot en consumo de inventario.

Flujo previsto:

Foodbot

↓

foodbot_mappings

↓

Producto ERP

↓

Cantidad de consumo

↓

inventory_movements

↓

calculate_inventory_movement()

↓

sync_branch_inventory()

↓

branch_inventory

---

# Observaciones

La lógica de deducción de inventario será implementada posteriormente dentro del `InventorySyncService`.

La base de datos únicamente almacena las equivalencias y mantiene la integridad de la información.

---

# Estado

✅ Sincronización completada.

La base de datos queda preparada para la integración con el servicio de sincronización de inventario.