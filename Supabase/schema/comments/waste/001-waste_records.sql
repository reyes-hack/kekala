BEGIN;

COMMENT ON TABLE public.waste_records IS
'Registro principal de mermas generadas por las sucursales.';

COMMENT ON COLUMN public.waste_records.id IS
'Identificador único del reporte de merma.';

COMMENT ON COLUMN public.waste_records.organization_id IS
'Organización propietaria del reporte.';

COMMENT ON COLUMN public.waste_records.branch_id IS
'Sucursal donde ocurrió la merma.';

COMMENT ON COLUMN public.waste_records.waste_number IS
'Folio único del reporte de merma dentro de la organización.';

COMMENT ON COLUMN public.waste_records.reported_by IS
'Usuario que registró la merma.';

COMMENT ON COLUMN public.waste_records.status_id IS
'Estado actual del reporte de merma.';

COMMENT ON COLUMN public.waste_records.reason_id IS
'Motivo principal de la merma obtenido del catálogo.';

COMMENT ON COLUMN public.waste_records.waste_date IS
'Fecha en que ocurrió la merma.';

COMMENT ON COLUMN public.waste_records.total_cost IS
'Costo total estimado de los productos mermados.';

COMMENT ON COLUMN public.waste_records.notes IS
'Observaciones adicionales sobre la merma.';

COMMENT ON COLUMN public.waste_records.metadata IS
'Información adicional del reporte en formato JSON.';

COMMENT ON COLUMN public.waste_records.created_at IS
'Fecha y hora de creación del registro.';

COMMENT ON COLUMN public.waste_records.updated_at IS
'Fecha y hora de la última actualización del registro.';

COMMIT;