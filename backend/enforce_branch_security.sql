-- =========================================================================================
-- MIGRATION: enforce_branch_security
-- DESCRIPCIÓN: 
-- Previene que empleados (cajeros) inserten cortes de caja en una sucursal a la cual
-- no están asignados en su perfil, previniendo herencia de estados del frontend.
-- =========================================================================================

CREATE OR REPLACE FUNCTION public.check_cash_closure_branch()
RETURNS TRIGGER AS $$
DECLARE
  v_user_branch UUID;
BEGIN
  -- Obtener la sucursal del empleado que está haciendo la inserción
  SELECT branch_id INTO v_user_branch
  FROM public.profiles
  WHERE id = auth.uid();

  -- Si el usuario tiene un branch asignado (es decir, es un empleado/cajero de una sucursal)
  -- y el branch del corte que intenta subir NO coincide, bloqueamos la transacción.
  -- Nota: Si v_user_branch es nulo (por ej. un super administrador global), lo permitimos.
  IF v_user_branch IS NOT NULL AND NEW.branch_id != v_user_branch THEN
      RAISE EXCEPTION 'Acceso Denegado: No puedes registrar un corte en una sucursal distinta a la tuya. (Tu Sucursal: %, Intentaste: %)', v_user_branch, NEW.branch_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar el trigger si ya existía y volver a crearlo
DROP TRIGGER IF EXISTS trg_check_cash_closure_branch ON public.cash_closures;

CREATE TRIGGER trg_check_cash_closure_branch
BEFORE INSERT OR UPDATE ON public.cash_closures
FOR EACH ROW
EXECUTE FUNCTION public.check_cash_closure_branch();
