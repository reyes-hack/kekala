BEGIN;

-- 1. Permitir lectura en branches
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura publica de sucursales" 
ON public.branches 
FOR SELECT 
USING (true);

-- 2. Permitir lectura en catalog_types
ALTER TABLE public.catalog_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura publica de tipos de catalogo" 
ON public.catalog_types 
FOR SELECT 
USING (true);

-- 3. Permitir lectura en catalog_values
ALTER TABLE public.catalog_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura publica de valores de catalogo" 
ON public.catalog_values 
FOR SELECT 
USING (true);

-- 4. Permitir lectura en products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura publica de productos" 
ON public.products 
FOR SELECT 
USING (true);

-- 5. Permitir lectura en branch_inventory
ALTER TABLE public.branch_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura publica de inventario por sucursal" 
ON public.branch_inventory 
FOR SELECT 
USING (true);

-- 6. Permitir insercion publica en branch_inventory (para inicializacion temporal en desarrollo)
CREATE POLICY "Permitir insercion publica de inventario por sucursal" 
ON public.branch_inventory 
FOR INSERT 
WITH CHECK (true);

-- 7. Permitir actualizacion publica en branch_inventory (para cambio de stock minimo e inventario)
CREATE POLICY "Permitir actualizacion publica de inventario por sucursal" 
ON public.branch_inventory 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 8. Permitir insercion publica en inventory_movements (para guardar ajustes manuales)
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir insercion publica de movimientos de inventario" 
ON public.inventory_movements 
FOR INSERT 
WITH CHECK (true);

-- 9. Permitir lectura publica en inventory_movements (para consultar historial / kardex)
CREATE POLICY "Permitir lectura publica de movimientos de inventario" 
ON public.inventory_movements 
FOR SELECT 
USING (true);

COMMIT;
