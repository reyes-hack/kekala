BEGIN;

COMMENT ON TABLE public.suppliers IS
'Catálogo de proveedores utilizados para abastecer productos e insumos del ERP.';

COMMENT ON COLUMN public.suppliers.id IS
'Identificador único del proveedor.';

COMMENT ON COLUMN public.suppliers.organization_id IS
'Organización propietaria del proveedor.';

COMMENT ON COLUMN public.suppliers.supplier_code IS
'Código único e inmutable del proveedor dentro de la organización.';

COMMENT ON COLUMN public.suppliers.name IS
'Nombre comercial del proveedor.';

COMMENT ON COLUMN public.suppliers.legal_name IS
'Razón social del proveedor.';

COMMENT ON COLUMN public.suppliers.tax_id IS
'RFC o identificador fiscal del proveedor.';

COMMENT ON COLUMN public.suppliers.contact_name IS
'Persona principal de contacto.';

COMMENT ON COLUMN public.suppliers.email IS
'Correo electrónico del proveedor.';

COMMENT ON COLUMN public.suppliers.phone IS
'Teléfono del proveedor.';

COMMENT ON COLUMN public.suppliers.address IS
'Dirección del proveedor.';

COMMENT ON COLUMN public.suppliers.city IS
'Ciudad del proveedor.';

COMMENT ON COLUMN public.suppliers.state IS
'Estado o provincia del proveedor.';

COMMENT ON COLUMN public.suppliers.postal_code IS
'Código postal del proveedor.';

COMMENT ON COLUMN public.suppliers.country_code IS
'Código ISO del país del proveedor.';

COMMENT ON COLUMN public.suppliers.notes IS
'Observaciones adicionales sobre el proveedor.';

COMMENT ON COLUMN public.suppliers.metadata IS
'Información adicional del proveedor en formato JSON.';

COMMENT ON COLUMN public.suppliers.is_active IS
'Indica si el proveedor puede utilizarse para nuevas órdenes de compra.';

COMMENT ON COLUMN public.suppliers.created_at IS
'Fecha y hora de creación del proveedor.';

COMMENT ON COLUMN public.suppliers.updated_at IS
'Fecha y hora de la última actualización del proveedor.';

COMMIT;