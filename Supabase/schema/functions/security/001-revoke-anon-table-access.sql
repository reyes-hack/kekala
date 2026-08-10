BEGIN;

----------------------------------------------------------------------
-- SEGURIDAD GLOBAL
--
-- La aplicación utiliza Supabase Auth.
--
-- El rol anon NO debe tener acceso directo a las tablas del ERP.
--
-- La autenticación mediante RPC/functions se mantiene separada.
-- NO revocamos EXECUTE de funciones aquí porque existen flujos como
-- verify_employee_pin que pueden necesitar ejecutarse antes de crear
-- una sesión autenticada.
----------------------------------------------------------------------


----------------------------------------------------------------------
-- TABLAS
----------------------------------------------------------------------

REVOKE ALL
ON ALL TABLES IN SCHEMA public
FROM anon;


----------------------------------------------------------------------
-- SECUENCIAS
--
-- Evita que anon pueda interactuar directamente con secuencias
-- pertenecientes al esquema público.
----------------------------------------------------------------------

REVOKE ALL
ON ALL SEQUENCES IN SCHEMA public
FROM anon;


----------------------------------------------------------------------
-- PREVENIR QUE FUTURAS TABLAS/SECUENCIAS VUELVAN A RECIBIR
-- PRIVILEGIOS PARA anon por defecto.
----------------------------------------------------------------------

ALTER DEFAULT PRIVILEGES
IN SCHEMA public
REVOKE ALL ON TABLES FROM anon;

ALTER DEFAULT PRIVILEGES
IN SCHEMA public
REVOKE ALL ON SEQUENCES FROM anon;

COMMIT;