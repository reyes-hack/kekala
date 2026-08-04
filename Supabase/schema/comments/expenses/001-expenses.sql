BEGIN;

COMMENT ON TABLE public.expenses IS
'Registro de gastos operativos realizados por las sucursales del ERP.';

COMMENT ON COLUMN public.expenses.id IS 'Identificador único del gasto.';
COMMENT ON COLUMN public.expenses.organization_id IS 'Organización propietaria del gasto.';
COMMENT ON COLUMN public.expenses.branch_id IS 'Sucursal donde se realizó el gasto.';
COMMENT ON COLUMN public.expenses.expense_number IS 'Folio único del gasto dentro de la organización.';
COMMENT ON COLUMN public.expenses.category_id IS 'Categoría del gasto obtenida del catálogo.';
COMMENT ON COLUMN public.expenses.establishment_id IS 'Establecimiento donde se realizó la compra.';
COMMENT ON COLUMN public.expenses.payment_method_id IS 'Método de pago utilizado.';
COMMENT ON COLUMN public.expenses.supplier_id IS 'Proveedor asociado al gasto cuando aplique.';
COMMENT ON COLUMN public.expenses.created_by IS 'Usuario que registró el gasto.';
COMMENT ON COLUMN public.expenses.currency_code IS 'Moneda utilizada para registrar el gasto.';
COMMENT ON COLUMN public.expenses.subtotal IS 'Subtotal antes de impuestos.';
COMMENT ON COLUMN public.expenses.tax_amount IS 'Impuestos del gasto.';
COMMENT ON COLUMN public.expenses.total_amount IS 'Importe total del gasto.';
COMMENT ON COLUMN public.expenses.expense_date IS 'Fecha en que ocurrió el gasto.';
COMMENT ON COLUMN public.expenses.description IS 'Descripción general del gasto.';
COMMENT ON COLUMN public.expenses.notes IS 'Observaciones adicionales.';
COMMENT ON COLUMN public.expenses.metadata IS 'Información adicional en formato JSON.';
COMMENT ON COLUMN public.expenses.created_at IS 'Fecha y hora de creación.';
COMMENT ON COLUMN public.expenses.updated_at IS 'Fecha y hora de la última actualización.';

COMMIT;