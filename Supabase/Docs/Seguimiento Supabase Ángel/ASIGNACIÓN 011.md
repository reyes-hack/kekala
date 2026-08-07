# Purchasing & Expenses - Temporary Refactor

## Objetivo

Documentar la simplificación temporal aplicada a los módulos de Compras y Gastos para acelerar el desarrollo del frontend y el despliegue inicial de la Web App.

---

# Compras

## Cambio realizado

La estructura de compras fue simplificada.

Se eliminó temporalmente la dependencia del detalle normalizado (`purchase_order_items`) y la información de los productos pasó a almacenarse dentro del campo:

- `order_data (JSON)`

Esto permite registrar órdenes completas desde el frontend sin depender de módulos adicionales.

---

# Gastos

## Cambio realizado

Los catálogos utilizados por el módulo de gastos dejaron de almacenarse mediante claves foráneas y pasaron a utilizar valores de texto.

Campos simplificados:

- category
- establishment
- payment_method
- responsible

El objetivo es reducir la complejidad del frontend durante la primera etapa del proyecto.

---

# Seguridad (RLS)

Las tablas mantienen Row Level Security habilitado.

Durante el desarrollo se utilizan políticas temporales de acceso para permitir la operación del frontend mientras el módulo de autenticación aún no se encuentra implementado.

Cuando Supabase Auth sea integrado, estas políticas deberán reemplazarse por reglas basadas en:

- auth.uid()
- current_profile()
- current_branch()
- current_organization()
- has_role()
- is_admin()

---

# Inventario

Actualmente el frontend registra movimientos directamente en `inventory_movements` cuando una orden de compra cambia al estado **ENTREGADA**.

Esta decisión fue tomada para acelerar el desarrollo del MVP y mantener sincronizado el inventario durante la etapa inicial.

La arquitectura objetivo del ERP continúa considerando a `inventory_movements` como el libro mayor del inventario.

En una etapa posterior, la generación de movimientos deberá centralizarse en servicios de backend o funciones de base de datos, evitando que el frontend escriba directamente sobre esta tabla.

---

# Impacto

La simplificación permite:

- Reducir dependencias entre módulos.
- Acelerar el desarrollo del frontend.
- Mantener operativa la captura de compras y gastos.

Como contraparte, se pospone temporalmente parte de la normalización del modelo de datos hasta la implementación del backend completo.

---

# Estado

✅ Refactor temporal documentado.

La arquitectura principal del ERP permanece sin cambios y esta simplificación se considera una solución de transición para el desarrollo del MVP.