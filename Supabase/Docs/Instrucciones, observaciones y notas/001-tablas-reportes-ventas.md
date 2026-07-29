# ASIGNACIÓN 001: Creación de tablas para Reportes de Ventas (Integración Foodbot)

¡Hola Ángel!

He estado revisando tu reciente push al repositorio con la arquitectura de catálogos y el mapa de entidades (`004-erp-entity-map.md` y `005-products-domain-design.md`). ¡Excelente trabajo sentando las bases! El diseño está súper limpio.

En base a eso, he adaptado esta primera asignación.

Acabo de terminar el script (scraper) que se conectará diario a Foodbot para extraer el resumen de ventas. Dado que Foodbot no nos da acceso a los "Tickets/Ventas individuales" sino únicamente al **Resumen Agregado Diario**, necesitamos un lugar donde guardar esta información histórica y de transición.

Noté en tu documento `004-erp-entity-map.md` que los KPIs, Ventas y Ticket Promedio están planeados como **Entidades Derivadas** (vistas o queries calculados). Estoy totalmente de acuerdo para cuando el ERP maneje las ventas nativamente, pero para esta integración externa con Foodbot, sí necesitaremos almacenar físicamente los totales diarios, ya que no tenemos los items base para calcularlos.

## Estructura de los Datos (El Output del Scraper)

El scraper arrojará la data con este formato numérico y estandarizado:

```json
{
  "fecha": "2026-07-28",
  "sucursales": [
    {
      "branchCode": "AMERICAS_VER",
      "branchName": "Américas Veracruz",
      "kpis": {
        "ordenes": 77,
        "ventas": 8670.00,
        "ticketPromedio": 112.6
      },
      "productosVendidos": [
        {
          "productCode": "CHOCO_CROCANTE",
          "productName": "Choco Crocante",
          "ordenes": 18,
          "cantidad": 22,
          "ventas": 1760.00
        }
      ]
    }
  ]
}
```

## Requerimientos y Diseño Sugerido

Para alinearnos con tu arquitectura, propongo el siguiente esquema para la integración de Foodbot. Siéntete libre de adaptarlo como el Arquitecto de BD que eres:

1. **Entidades Base (Si aún no las creas)**
   - `branches` (Sucursales). Veo que ya está en tu mapa. (e.g. `AMERICAS_VER`)
   - `products` (Productos). Sé que tienes un diseño complejo para ellos (`005-products-domain-design.md`), podemos crear la tabla básica ahora para mapear los códigos (`CHOCO_CROCANTE`) y luego le vas inyectando las dependencias a los catálogos.

2. **Tabla `foodbot_daily_reports` (Reporte Diario Integración)**
   - *Nota: Le puse prefijo `foodbot_` o `external_` para diferenciarla de las tablas transaccionales del core del ERP.*
   - `id` (PK)
   - `branch_code` (FK a `branches`)
   - `report_date` (Date ISO - YYYY-MM-DD)
   - `total_orders` (Int)
   - `total_sales` (Numeric/Decimal)
   - `average_ticket` (Numeric/Decimal)
   *Constraint Sugerido: Unique(branch_code, report_date).*

3. **Tabla `foodbot_daily_product_sales` (Ventas de Productos por Día)**
   - `id` (PK)
   - `daily_report_id` (FK a `foodbot_daily_reports`)
   - `product_code` (FK a `products`)
   - `orders_count` (Int)
   - `quantity_sold` (Int)
   - `total_sales` (Numeric/Decimal)

## ⚠️ REGLAS OBLIGATORIAS PARA ESTA ASIGNACIÓN

1. **Respaldar en Git**: Como hiciste con los catálogos, recuerda guardar los nuevos scripts de creación en tu carpeta de esquemas (`Supabase/schema/tables/` o `Supabase/schema/migrations/`).
2. **Commit y Push**: Manda tus cambios con un buen mensaje, algo como: `feat(db): schema para integración de reportes de ventas foodbot`.
3. **Tracking**: Documenta el avance en `Supabase/Docs/Seguimiento Supabase (Ángel)/`.

¡Avisame cuando las tablas estén arriba para que yo conecte el script y empecemos a automatizar la ingesta de datos!
