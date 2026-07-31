BEGIN;

------------------------------------------------------------------
-- Tabla
------------------------------------------------------------------

COMMENT ON TABLE public.products IS
'Catálogo maestro de productos del ERP. Representa las entidades comerciales utilizadas en ventas, compras, inventario, mermas e integraciones.';

------------------------------------------------------------------
-- Columnas
------------------------------------------------------------------

COMMENT ON COLUMN public.products.id IS
'Identificador único del producto.';

COMMENT ON COLUMN public.products.product_code IS
'Código único e inmutable del producto utilizado para integraciones y procesos internos.';

COMMENT ON COLUMN public.products.name IS
'Nombre comercial del producto.';

COMMENT ON COLUMN public.products.description IS
'Descripción opcional del producto.';

COMMENT ON COLUMN public.products.category_id IS
'Categoría del producto obtenida del catálogo de categorías de productos.';

COMMENT ON COLUMN public.products.unit_id IS
'Unidad de medida obtenida del catálogo de unidades.';

COMMENT ON COLUMN public.products.is_active IS
'Indica si el producto se encuentra disponible para su uso en el ERP.';

COMMENT ON COLUMN public.products.created_at IS
'Fecha y hora de creación del registro.';

COMMENT ON COLUMN public.products.updated_at IS
'Fecha y hora de la última actualización del registro.';

COMMIT;