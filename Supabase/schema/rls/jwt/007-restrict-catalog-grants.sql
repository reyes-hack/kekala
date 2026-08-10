BEGIN;

----------------------------------------------------------------------
-- PRODUCTS
--
-- anon no debe tener ningún privilegio directo.
--
-- authenticated conserva los privilegios necesarios porque RLS
-- determina qué operaciones puede realizar cada rol de aplicación.
----------------------------------------------------------------------

REVOKE ALL
ON TABLE public.products
FROM anon;


----------------------------------------------------------------------
-- PRODUCTS_POS
--
-- El acceso directo a la vista tampoco debe estar disponible para
-- usuarios anónimos.
--
-- El POS utilizará get_pos_products().
----------------------------------------------------------------------

REVOKE ALL
ON TABLE public.products_pos
FROM anon;

REVOKE ALL
ON TABLE public.products_pos
FROM authenticated;


----------------------------------------------------------------------
-- El acceso del POS se realiza exclusivamente mediante la RPC.
----------------------------------------------------------------------

GRANT EXECUTE
ON FUNCTION public.get_pos_products()
TO authenticated;

COMMIT;