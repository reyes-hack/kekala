BEGIN;

------------------------------------------------------------------
-- Eliminar restricción UNIQUE anterior
------------------------------------------------------------------

ALTER TABLE public.branch_inventory
DROP CONSTRAINT IF EXISTS branch_inventory_branch_id_product_id_key;

------------------------------------------------------------------
-- Crear nueva restricción UNIQUE
------------------------------------------------------------------

ALTER TABLE public.branch_inventory
ADD CONSTRAINT uq_branch_inventory_org_branch_product
UNIQUE (
    organization_id,
    branch_id,
    product_id
);

COMMIT;