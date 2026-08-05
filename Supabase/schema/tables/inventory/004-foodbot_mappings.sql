BEGIN;

CREATE TABLE IF NOT EXISTS public.foodbot_mappings (

    ------------------------------------------------------------------
    -- Primary Key
    ------------------------------------------------------------------
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    ------------------------------------------------------------------
    -- Definición de Regla
    ------------------------------------------------------------------
    -- El nombre exacto que arroja Foodbot en la columna ModifierItem o Item.
    foodbot_name TEXT NOT NULL,

    -- A qué producto de la base de datos (inventario físico) le corresponde.
    product_id UUID NOT NULL,

    -- Cuánto descuenta del inventario (ej. 0.05 para 50ml de una cobertura en litro).
    deduction_quantity NUMERIC(10, 4) NOT NULL
        DEFAULT 1.0000,

    ------------------------------------------------------------------
    -- Estado
    ------------------------------------------------------------------
    is_active BOOLEAN NOT NULL
        DEFAULT TRUE,

    ------------------------------------------------------------------
    -- Auditoría
    ------------------------------------------------------------------
    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    ------------------------------------------------------------------
    -- Foreign Keys
    ------------------------------------------------------------------
    CONSTRAINT fk_foodbot_mappings_product
        FOREIGN KEY (product_id)
        REFERENCES public.products(id)
        ON DELETE CASCADE,

    ------------------------------------------------------------------
    -- Unique Constraints
    ------------------------------------------------------------------
    -- No puede haber dos reglas activas (o inactivas) con el mismo nombre exacto de foodbot, 
    -- salvo que las queramos separar (pero por simplificidad, hacemos el nombre único).
    CONSTRAINT uq_foodbot_mappings_name
        UNIQUE (foodbot_name),

    ------------------------------------------------------------------
    -- Check Constraints
    ------------------------------------------------------------------
    CONSTRAINT chk_foodbot_mappings_name
        CHECK (
            LENGTH(TRIM(foodbot_name)) > 0
        ),
        
    CONSTRAINT chk_foodbot_mappings_qty
        CHECK (
            deduction_quantity > 0
        )
);

-- Habilitar RLS en la nueva tabla
ALTER TABLE public.foodbot_mappings ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (RLS)
-- Por ahora, permitimos todo el acceso (CRUD) para que el Frontend (React) pueda operar sin bloqueos
CREATE POLICY "Permitir TODO en foodbot_mappings" 
ON public.foodbot_mappings 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Índice para búsquedas rápidas al mapear nombres
CREATE INDEX IF NOT EXISTS idx_foodbot_mappings_name ON public.foodbot_mappings(foodbot_name);

COMMIT;
