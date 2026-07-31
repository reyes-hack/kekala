BEGIN;

------------------------------------------------------------------
-- Relación entre productos importados y catálogo maestro
------------------------------------------------------------------

ALTER TABLE public.external_sales_report_items
ADD CONSTRAINT fk_external_sales_report_items_product
FOREIGN KEY (product_id)
REFERENCES public.products(id)
ON UPDATE CASCADE
ON DELETE SET NULL;

COMMIT;