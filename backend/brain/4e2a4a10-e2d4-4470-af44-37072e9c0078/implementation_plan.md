# Plan de Acción: Corrección de Sincronización Foodbot y Recetario

## Problema detectado (Por qué estaba sumando en vez de restando)
¡Tienes toda la razón! Encontré un **bug crítico** en la lógica de sincronización (`InventorySyncService.ts`).
Resulta que Foodbot, en su reporte, a veces desglosa el mismo modificador o producto en múltiples líneas (por ejemplo, "Cobertura Crocante de Avellanas" aparece dos veces si se vendió en diferentes categorías o combos). 
El script actual tomaba la primera línea (ej. 11 piezas) y la restaba contra el **total histórico guardado del día** (ej. 18 piezas). Al hacer `11 - 18 = -7`, el sistema pensaba que se habían cancelado 7 órdenes y le sumaba (+7) a tu inventario. Luego tomaba la segunda línea (ej. 7 piezas) y hacía `7 - 18 = -11` sumando otras (+11).
En resumen: Estaba tomando piezas fragmentadas y comparándolas contra el total completo, lo que resultaba en números negativos y sumas de inventario erróneas.

## Solución Propuesta

### 1. Arreglar el Bug del Código (`InventorySyncService.ts`)
Voy a refactorizar el código para que primero agrupe y sume todas las líneas idénticas que manda Foodbot en el día. Una vez que tengamos el "Total Real del Día" (ej. 11 + 7 = 18), lo comparará con el de la base de datos para calcular la diferencia correctamente y descontar el inventario de forma precisa.

### 2. Actualizar el Recetario a 20ml
Ejecutaré un script SQL que actualizará la tabla `foodbot_mappings` (el recetario). Todas las entradas cuyo nombre contenga la palabra "Cobertura" o "Relleno" tendrán su `deduction_quantity` ajustada automáticamente a `20`.

### 3. Limpiar la Basura de Hoy y Re-sincronizar
Para dejar tu inventario impecable:
1. Borraré todos los movimientos de inventario (`inventory_movements`) que se hicieron hoy a través de Foodbot (las sumas y restas erróneas).
2. Borraré los reportes de ventas externas de hoy.
3. Volveré a correr el `manual_sync.ts` para que, con la nueva regla de 20ml y el bug de la suma arreglado, haga el descuento de hoy perfectamente.

> [!IMPORTANT]
> Necesito tu aprobación para borrar los movimientos de inventario de Foodbot registrados el día de hoy antes de hacer la resincronización limpia. Solo borraré los de Foodbot, no tocaré nada hecho manualmente o por mermas.
