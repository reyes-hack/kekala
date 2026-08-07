BEGIN;

COMMENT ON TABLE public.foodbot_mappings IS
'Relación entre productos de Foodbot y productos internos del ERP para el cálculo automático del consumo de inventario.';

COMMENT ON COLUMN public.foodbot_mappings.id IS
'Identificador único del mapeo.';

COMMENT ON COLUMN public.foodbot_mappings.foodbot_name IS
'Nombre del producto recibido desde Foodbot.';

COMMENT ON COLUMN public.foodbot_mappings.product_id IS
'Producto interno del ERP asociado al producto de Foodbot.';

COMMENT ON COLUMN public.foodbot_mappings.deduction_quantity IS
'Cantidad de inventario que debe descontarse por cada venta proveniente de Foodbot.';

COMMENT ON COLUMN public.foodbot_mappings.is_active IS
'Indica si el mapeo permanece disponible para la sincronización automática.';

COMMENT ON COLUMN public.foodbot_mappings.created_at IS
'Fecha y hora de creación del registro.';

COMMENT ON COLUMN public.foodbot_mappings.updated_at IS
'Fecha y hora de la última actualización del registro.';

COMMIT;