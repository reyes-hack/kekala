UPDATE public.foodbot_mappings
SET deduction_quantity = 20
WHERE foodbot_name ILIKE '%cobertura%' 
   OR foodbot_name ILIKE '%relleno%';
