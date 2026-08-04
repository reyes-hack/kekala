BEGIN;

COMMENT ON TABLE public.expense_attachments IS
'Archivos y comprobantes asociados a un gasto.';

COMMENT ON COLUMN public.expense_attachments.id IS
'Identificador único del archivo.';

COMMENT ON COLUMN public.expense_attachments.organization_id IS
'Organización propietaria del archivo.';

COMMENT ON COLUMN public.expense_attachments.expense_id IS
'Gasto al que pertenece el comprobante.';

COMMENT ON COLUMN public.expense_attachments.uploaded_by IS
'Usuario que cargó el archivo.';

COMMENT ON COLUMN public.expense_attachments.file_name IS
'Nombre original del archivo.';

COMMENT ON COLUMN public.expense_attachments.file_url IS
'Ruta o URL del archivo almacenado en Supabase Storage.';

COMMENT ON COLUMN public.expense_attachments.file_type IS
'Tipo MIME del archivo.';

COMMENT ON COLUMN public.expense_attachments.file_size IS
'Tamaño del archivo en bytes.';

COMMENT ON COLUMN public.expense_attachments.metadata IS
'Información adicional del archivo en formato JSON.';

COMMENT ON COLUMN public.expense_attachments.created_at IS
'Fecha y hora de carga del archivo.';

COMMIT;