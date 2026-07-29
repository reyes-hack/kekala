ALTER TABLE public.catalog_types
ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.catalog_types
ADD CONSTRAINT catalog_types_sort_order_check
CHECK (sort_order >= 0);