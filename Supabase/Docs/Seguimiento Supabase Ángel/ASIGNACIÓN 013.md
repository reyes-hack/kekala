# Branch License Limit

## Objetivo

Implementar una validación a nivel de base de datos para impedir que una organización registre más sucursales de las permitidas por su licencia.

---

# Implementación

Se creó la función:

- check_branch_license_limit()

y el trigger:

- trg_branch_license_limit

El trigger se ejecuta antes de insertar una nueva sucursal y valida la cantidad de sucursales existentes para la organización.

Si el límite es alcanzado, la operación es cancelada mediante una excepción.

---

# Límite actual

Actualmente el sistema permite un máximo de:

- 2 sucursales por organización

Este valor fue implementado como una variable interna dentro de la función para facilitar futuras modificaciones.

---

# Escalabilidad

La implementación fue diseñada para evolucionar hacia un sistema de licenciamiento SaaS.

En una futura versión, el límite dejará de ser fijo y será obtenido desde el módulo de licencias asociado a cada organización.

De esta manera no será necesario modificar el trigger ni las políticas de negocio cuando existan distintos planes comerciales.

---

# Beneficios

- Evita el bypass de validaciones del frontend.
- Garantiza el cumplimiento del licenciamiento desde la base de datos.
- Mantiene una arquitectura preparada para planes escalables.

---

# Estado

✅ Restricción de licenciamiento implementada.
