# Plan de Implementación: Corrección de Race Condition en Inventario (Sincronizador Foodbot)

## Descripción del Problema (El "Salto Fantasma" y la condición de carrera)
El usuario detectó magistralmente el origen del bug con la captura de pantalla: en el mismo milisegundo se insertan múltiples movimientos de venta para el mismo producto (ej. `-3` y `-6` partiendo ambos de 260).

**¿Por qué ocurre esto?**
1. En Foodbot, hay múltiples modificadores distintos (ej. "Con fresa", "Extra fresa") que el backend mapea hacia el mismo `product_id` físico (Paleta Fresa).
2. El script de Node.js actual (`InventorySyncService.ts`) empuja ambas restas al arreglo y hace un **bulk insert** en Supabase: `supabase.from('inventory_movements').insert([ {-3}, {-6} ])`.
3. En PostgreSQL, cuando haces un insert masivo, los triggers `BEFORE INSERT` de todas las filas se ejecutan **antes** de que el stock real se actualice. Entonces, la fila 1 lee que hay 260. La fila 2 lee que SIGUE habiendo 260.
4. Luego, los triggers `AFTER INSERT` actualizan la tabla final (`branch_inventory`). La fila 1 dice "pon el stock en 257". La fila 2 dice "pon el stock en 254". **El último sobreescribe al primero**.
5. Conclusión: ¡Las 3 piezas se perdieron en el limbo de la base de datos! Se registraron en el Kárdex, pero no afectaron al stock real. Esta es la razón de que el Kárdex sume 206 y la base de datos marque 247 (se han perdido 41 piezas en estas colisiones).

## Cambios Propuestos

### Componente: Backend (Servicio de Sincronización)

#### [MODIFY] `backend/src/application/services/InventorySyncService.ts`
- **Modificación:** En lugar de empujar directamente a `inventoryMovements.push()`, crearemos un mapa temporal (o agrupación) por `product_id`.
- Sumaremos todas las deducciones (de diferentes modificadores) que apunten al mismo `product_id`.
- Después del bucle, iteraremos sobre este mapa y enviaremos **un solo registro agrupado** de `inventory_movements` por producto.
- Esto soluciona la colisión de PostgreSQL y cumple con la regla de negocio del cliente: "una sola resta agrupada por sincronización".

### Componente: Base de Datos (Corrección del desfasaje)

#### [NEW] `fix_branch_inventory_desync.sql` (Script Temporal / Scratch)
- **Modificación:** Crear un script SQL simple que recalcule el `current_stock` de la tabla `branch_inventory` basándose al 100% en la sumatoria histórica real de `inventory_movements` (el Kárdex).
- Esto bajará el stock de las 247 piezas reportadas erróneamente en sistema a las 206 (o el número exacto actual) que marcan las matemáticas perfectas del Kárdex.

## Verificación
- Correr el script SQL para resincronizar el inventario.
- Reiniciar el backend o revisar el código modificado de `InventorySyncService.ts` para asegurar que compila.
- Confirmar visualmente que si hay ventas futuras, se agruparán.

> [!CAUTION]
> **Revisión del Usuario Requerida**: ¿Estás de acuerdo con agrupar todas las ventas de distintos modificadores (que apunten al mismo producto) en un solo registro de "Venta Foodbot" en el Kárdex para evitar la colisión? Esto arreglará el problema de raíz.
