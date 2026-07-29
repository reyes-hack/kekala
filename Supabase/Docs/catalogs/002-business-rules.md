# Catalogs Business Rules
---

# Objetivo

Definir las reglas de negocio para la administración de los catálogos del ERP.

Los catálogos representan información de referencia utilizada por múltiples módulos.

---

# Principios

Los catálogos deberán ser:

- consistentes
- reutilizables
- auditables
- fáciles de administrar

---

# Regla 1

Todo catálogo deberá tener un nombre único.

Ejemplo.

```
SHIFT

UNIT

PAYMENT_METHOD
```

---

# Regla 2

Todo elemento pertenece a un catálogo.

Nunca existirá un elemento sin catálogo.

---

# Regla 3

Los elementos podrán activarse o desactivarse.

No deberán eliminarse físicamente.

---

# Regla 4

Los elementos deberán poder ordenarse.

El sistema respetará dicho orden al mostrarlos.

---

# Regla 5

Los elementos podrán tener un código único dentro de su catálogo.

Ejemplo.

```
EFE

TDC

TRF
```

---

# Regla 6

Los elementos podrán tener un color asociado.

Este color será utilizado únicamente por la interfaz.

Ejemplo.

Turnos.

Matutino

↓

Verde

---

Vespertino

↓

Naranja

---

Nocturno

↓

Azul

---

# Regla 7

Los catálogos podrán utilizarse como filtros.

---

# Regla 8

Todos los módulos deberán reutilizar los mismos catálogos.

No podrán crear listas independientes.

---

# Regla 9

Todo cambio en un catálogo deberá conservar auditoría.

---

# Regla 10

Los catálogos deberán poder inicializarse mediante Seeds.