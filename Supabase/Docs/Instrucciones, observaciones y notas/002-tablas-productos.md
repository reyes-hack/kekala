# ASIGNACIÓN 002: Catálogo Central de Productos (El Corazón del ERP)

Ahora que tenemos una base sólida con tu módulo de Catálogos (y me encantó tu `005-products-domain-design.md`), es hora de crear la pieza central de nuestro ERP: **El Producto**. 

Como Kekala es una empresa física (helados, paletas, insumos), **absolutamente todo** gira en torno a los productos. No podemos registrar mermas, ni hacer traspasos, ni registrar ventas propias sin este catálogo.

## Requerimientos y Diseño Sugerido

Basándome en tus notas de diseño (donde resolviste excelentemente que cada combinación *Especial Original*, *Especial Flat* es un producto único), necesitamos que construyas la tabla principal `products`.

### Tabla `products`
Te dejo una sugerencia de la estructura para que la adaptes a tu estilo. Debería integrar las Foreign Keys a los catálogos que ya creaste (`catalog_types`, `catalog_values`, etc.).

- `id` (UUID - PK)
- `product_code` (VARCHAR - Unique) - Ejemplo: `ESPECIAL_ORIGINAL`
- `name` (VARCHAR) - Ejemplo: `Especial Original`
- `description` (TEXT)
- `category_id` (UUID - FK a la tabla de catálogos: Ej. *Paletas*, *Insumos*, *Bebidas*)
- `unit_id` (UUID - FK a la tabla de catálogos: Ej. *Pieza*, *Caja*, *Litro*)
- `sale_price` (Numeric) - Precio de venta público
- `minimum_stock` (Int) - Para alertas de desabasto
- `is_active` (Boolean) - Default `true`

## ⚠️ REGLAS OBLIGATORIAS

Recuerda nuestras políticas de desarrollo:
1. **Respaldar en Git**: Guarda tu script SQL de creación en `Supabase/schema/tables/products.sql` (o en migraciones, como prefieras organizar el módulo de inventario).
2. **Commit y Push**: Haz commit con un mensaje claro, ej: `feat(db): creacion de tabla maestra de productos`.
3. **Tracking**: Documenta el avance o cualquier trigger extra en `Supabase/Docs/Seguimiento Supabase (Ángel)/`.
