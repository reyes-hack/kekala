# Configuración y Empleados — Acceso por NIP

## 1. Objetivo

Implementar una estructura segura para el acceso de empleados al ERP mediante **NIP de 6 dígitos**, manteniendo Supabase Auth como mecanismo de identidad y evitando que el frontend pueda decidir por sí mismo qué permisos tiene cada usuario.

La solución también establece aislamiento por:

- Organización.
- Sucursal.
- Rol.
- Sesión de auditoría.

El objetivo principal fue permitir una operación sencilla para los empleados, especialmente en dispositivos de punto de venta, sin sacrificar los controles de seguridad a nivel de base de datos.

---

## 2. Acceso de empleados mediante NIP

Los empleados no necesitan interactuar directamente con un correo electrónico durante la operación normal del ERP.

Para esto se creó una estructura separada para las credenciales:

### `employee_credentials`

La tabla contiene:

- `id`
- `profile_id`
- `pin_hash`
- `is_active`
- `last_login_at`
- `created_at`
- `updated_at`

El PIN se almacena como **hash**, nunca como texto plano.

### ¿Por qué?

El NIP es una credencial sensible. Guardarlo directamente en `profiles` o en texto plano aumentaría el impacto de una posible filtración de datos.

La separación de `employee_credentials` también permite administrar el estado de las credenciales y registrar el último acceso sin mezclar estos datos con la información general del perfil.

---

## 3. Verificación segura del NIP

Se implementó la función:

```text
verify_employee_pin

La función utiliza SECURITY DEFINER.

Su propósito es validar el PIN desde el backend y no depender de una comparación realizada por el frontend.

También se implementó:

provision_employee

para centralizar la creación/provisión de empleados desde una función con privilegios controlados.

¿Por qué?

El frontend no debe tener privilegios suficientes para crear directamente usuarios o manipular credenciales sensibles.

La lógica de creación y validación se concentra en funciones de base de datos para reducir la superficie de ataque y mantener las reglas de seguridad fuera del cliente.

4. Roles

La arquitectura utiliza principalmente dos roles operativos:

ADMIN
CASHIER
ADMIN

El administrador tiene acceso global a la información y operaciones autorizadas por el sistema.

No está limitado por una sucursal específica.

CASHIER

El empleado opera únicamente dentro del contexto de su organización y sucursal.

No debe poder utilizar su sesión para consultar o modificar información perteneciente a otra sucursal.

5. JWT como fuente de autorización

Se mantienen helpers basados en los claims del JWT:

has_jwt_role()
is_jwt_admin()
jwt_branch_id()
jwt_organization_id()

También se implementaron helpers para validar el contexto:

is_same_branch()
is_same_organization()
is_same_org_and_branch()
¿Por qué?

La autorización no debe depender de valores enviados libremente por el frontend.

El frontend puede solicitar una operación indicando una sucursal, organización o registro, pero la base de datos debe comprobar que ese contexto corresponde realmente al usuario autenticado.

Por eso las políticas RLS utilizan los claims del JWT y funciones de validación.

6. Row Level Security

Las tablas operativas del esquema public mantienen RLS habilitado.

La auditoría final confirmó que las tablas revisadas presentan:

rowsecurity = true

Esto incluye módulos como:

Auditorías.
Inventario.
Gastos.
Ventas.
Mermas.
Compras.
Sucursales.
Productos.
Configuración.
Notificaciones.
Credenciales de empleados.
¿Por qué?

RLS proporciona una segunda capa de seguridad independiente del frontend.

Aunque un usuario intente acceder directamente a la API de Supabase, las políticas de PostgreSQL siguen determinando qué registros puede consultar o modificar.

7. Eliminación del acceso anon

Durante la auditoría se detectó que el rol anon conservaba privilegios SQL sobre numerosas tablas debido a permisos heredados de etapas anteriores del desarrollo.

Se corrigió mediante un script de seguridad que revoca los privilegios de tablas y secuencias para anon.

La validación posterior produjo:

0 rows

para los privilegios de tablas del rol anon.

También se confirmó:

0 rows

para políticas RLS dirigidas explícitamente a anon.

¿Por qué?

El ERP utiliza usuarios autenticados.

Por lo tanto, no es necesario mantener acceso directo del rol anónimo a las tablas internas del sistema.

Esto aplica el principio de:

mínimo privilegio

y reduce la superficie de exposición de la base de datos.

Las funciones específicas de autenticación se mantienen separadas para no romper los flujos que pueden ejecutarse antes de establecer una sesión autenticada.

8. Aislamiento por sucursal y organización

Para las operaciones de empleados se estableció el siguiente principio:

CASHIER
   ↓
organización propia
   ↓
sucursal propia
   ↓
datos de esa sucursal

El acceso no se concede simplemente porque el usuario tenga el rol CASHIER.

Las políticas también verifican el contexto de organización y sucursal mediante los claims JWT y los helpers de seguridad.

Esto evita que un empleado pueda modificar una solicitud para intentar consultar o insertar información de otra sucursal.

9. Estado de esta parte

La infraestructura base de autenticación, roles y aislamiento quedó implementada y validada.

Estado:

✅ NIP almacenado mediante hash
✅ Credenciales separadas del perfil
✅ Verificación de PIN mediante función segura
✅ Provisión de empleados mediante función segura
✅ Roles ADMIN / CASHIER
✅ Claims JWT para autorización
✅ Aislamiento por organización
✅ Aislamiento por sucursal
✅ RLS habilitado
✅ Acceso de tablas para anon eliminado

# Configuración y Empleados — Acceso por NIP

## Parte 2 — Auditoría, permisos del CASHIER y protección del POS

## 10. Auditoría de inventario

El módulo de Auditoría de Inventario utiliza un flujo de **conteo ciego**.

El objetivo es que el empleado pueda registrar físicamente las cantidades encontradas en la sucursal sin conocer previamente el inventario teórico almacenado por el sistema.

El flujo implementado es:

```text
CASHIER
   │
   │ registra cantidad física
   ▼
audit_counts
   │
   ▼
trigger de base de datos
   │
   ├── obtiene expected_stock
   └── calcula difference
   │
   ▼
registro final

El frontend únicamente necesita enviar el dato que el empleado conoce:

counted_stock

No debe enviar:

expected_stock
difference

Estos valores son responsabilidad de la base de datos.

11. Cálculo automático de diferencias

La tabla audit_counts contiene:

id
session_id
organization_id
product_id
expected_stock
counted_stock
difference
evidence_photo_url
notes
created_at

Existe un trigger:

trg_audit_counts_difference

configurado como:

BEFORE INSERT

Su función es obtener el inventario teórico y calcular automáticamente:

difference = counted_stock - expected_stock
¿Por qué?

El empleado no debe poder manipular el inventario teórico desde el frontend.

Si el frontend pudiera enviar:

{
  "expected_stock": 100,
  "counted_stock": 95,
  "difference": -5
}

un usuario malicioso podría modificar esos valores antes de enviarlos a Supabase.

Al realizar el cálculo dentro de PostgreSQL, el valor utilizado para la conciliación proviene del backend.

12. Protección de audit_counts

Inicialmente existía una política que permitía a cualquier usuario con rol CASHIER insertar registros:

has_jwt_role('CASHIER')

Esta validación era insuficiente porque no comprobaba a qué sesión de auditoría pertenecía el registro.

Se reemplazó por una validación mediante:

can_insert_audit_count(session_id)

La función utiliza:

SECURITY DEFINER

y valida que la sesión:

Pertenezca al usuario autenticado.
Pertenezca a la misma organización indicada por el JWT.
Pertenezca a la misma sucursal indicada por el JWT.

El resultado es:

CASHIER
   │
   ▼
audit_counts
   │
   ▼
can_insert_audit_count(session_id)
   │
   ├── usuario correcto
   ├── organización correcta
   └── sucursal correcta

Solo después de superar estas comprobaciones se permite el INSERT.

13. Auditoría verdaderamente ciega

El CASHIER puede:

INSERT audit_counts

pero no tiene permiso para:

SELECT audit_counts

Esto mantiene el principio de conteo ciego:

Empleado
   │
   ├── registra conteo físico ✅
   │
   └── consulta resultado ❌

El administrador es quien puede consultar los resultados y realizar la conciliación correspondiente.

¿Por qué?

La separación evita que el empleado pueda comparar inmediatamente su conteo contra el inventario teórico y modificar deliberadamente el resultado.

El sistema recibe el conteo físico y calcula la diferencia de manera independiente.

14. Sesiones de auditoría

Los conteos están vinculados mediante:

audit_counts.session_id
        ↓
audit_sessions.id

Esto permite utilizar la sesión como contexto de seguridad.

Una sesión contiene información como:

organización;
sucursal;
usuario que la inició;
estado;
fecha de inicio;
fecha de finalización.

La relación permite comprobar que un empleado no pueda utilizar arbitrariamente el UUID de una sesión perteneciente a otra sucursal.

15. Permisos del CASHIER

El rol CASHIER está pensado para operaciones de sucursal.

Su acceso se encuentra limitado mediante RLS y validaciones de contexto.

Entre las operaciones contempladas se encuentran:

Gastos
Auditorías
Mermas
Ventas
Operación de sucursal

La regla principal es:

CASHIER
   ↓
solo organización propia
   ↓
solo sucursal propia

El empleado no recibe acceso global por el simple hecho de estar autenticado.

16. Protección del inventario

El empleado no debe consultar directamente el inventario teórico.

Esto es especialmente importante durante las auditorías.

El objetivo es evitar que una consulta como:

SELECT *
FROM branch_inventory;

permita al CASHIER conocer:

current_stock

antes de realizar el conteo físico.

La información utilizada para calcular expected_stock se obtiene desde el backend mediante la lógica controlada del trigger.

17. Catálogo POS y costos internos

También se detectó que la tabla products contiene información que no debe exponerse al CASHIER, principalmente:

cost_price
box_price

Por este motivo se creó una interfaz específica para el POS:

products_pos

La vista contiene únicamente los datos necesarios para la operación:

id
product_code
name
description
category_id
unit_id
is_active

No contiene:

cost_price
box_price
18. Función get_pos_products

Para evitar que el CASHIER necesite acceso directo a la tabla completa products, se creó:

get_pos_products()

La función utiliza:

SECURITY DEFINER

y solamente permite su ejecución a usuarios autenticados con los roles autorizados.

La función devuelve exclusivamente los datos necesarios para el POS.

¿Por qué?

El objetivo es aplicar el principio de mínima exposición de datos.

El frontend necesita saber:

qué producto es
cómo se llama
qué código tiene
qué categoría tiene
si está activo

pero no necesita conocer:

costo interno
costo por caja

Por lo tanto, esos campos nunca forman parte de la respuesta utilizada por el POS.

19. Restricción de get_pos_products

Inicialmente se detectó que anon también tenía EXECUTE sobre la función.

Esto se corrigió explícitamente.

La validación final mostró:

get_pos_products
├── authenticated → EXECUTE
├── postgres      → EXECUTE
└── service_role  → EXECUTE

y:

anon → ❌

De esta manera, un usuario no autenticado no puede utilizar la función del catálogo POS.

20. Eliminación de privilegios anónimos

Durante la auditoría se detectaron privilegios heredados para anon sobre múltiples tablas del ERP.

Se ejecutó una limpieza de privilegios para eliminar el acceso directo del rol anónimo a las tablas y secuencias del esquema público.

La comprobación posterior devolvió:

0 rows

Esto confirma que el rol anon ya no tiene privilegios directos sobre las tablas revisadas.

También se confirmó que no existen políticas RLS dirigidas explícitamente a anon.

21. Estado de seguridad de esta parte

Al finalizar esta etapa quedaron implementados:

✅ Conteo ciego
✅ Cálculo de expected_stock en backend
✅ Cálculo automático de difference
✅ Validación de session_id
✅ Validación de usuario propietario de la sesión
✅ Validación de organización
✅ Validación de sucursal
✅ CASHIER sin SELECT sobre audit_counts
✅ Protección del inventario teórico
✅ Vista products_pos
✅ Ocultamiento de cost_price
✅ Ocultamiento de box_price
✅ get_pos_products()
✅ RPC POS restringida a usuarios autenticados
✅ anon sin acceso directo a tablas

La arquitectura resultante mantiene una separación clara:

                    FRONTEND
                       │
              ┌────────┴────────┐
              │                 │
           ADMIN             CASHIER
              │                 │
              ▼                 ▼
        acceso global      contexto limitado
                                │
                       ┌────────┴─────────┐
                       │                  │
                    sucursal           sesión
                       │                  │
                       └────────┬─────────┘
                                ▼
                              RLS
                                │
                                ▼
                         PostgreSQL
                                │
                       ┌────────┴─────────┐
                       │                  │
                    triggers          funciones
                       │                  │
                       ▼                  ▼
                 datos calculados    validaciones
22. Validación final

La auditoría final confirmó que todas las tablas públicas revisadas mantienen:

rowsecurity = true

incluyendo:

audit_counts
audit_sessions
branch_inventory
branches
employee_credentials
expenses
inventory_movements
notifications
products
profiles
sales
waste_records
y las demás tablas operativas revisadas.

También se verificó que los únicos casos encontrados con:

USING (true)

corresponden a la lectura autenticada de:

catalog_types
catalog_values

lo cual corresponde al comportamiento esperado para catálogos de referencia.

23. Resultado

La configuración deja al ERP con una separación clara entre:

Identidad

Supabase Auth
JWT
profiles
employee_credentials

Autorización

roles
JWT claims
RLS
security-definer functions

Operación

ADMIN → acceso global autorizado
CASHIER → operación limitada por organización y sucursal

Auditoría

conteo físico
      ↓
audit_counts
      ↓
trigger
      ↓
stock teórico + diferencia

POS

CASHIER
   ↓
get_pos_products()
   ↓
catálogo operativo
   ↓
sin costos internos

La decisión principal fue mantener la experiencia de uso sencilla para el empleado, pero trasladar las decisiones de seguridad y autorización al backend y a PostgreSQL, evitando confiar en validaciones realizadas únicamente por el frontend.


# Configuración y Empleados — Acceso por NIP

## Parte 3 — Decisiones arquitectónicas, archivos y validación final

## 24. Decisiones arquitectónicas

La implementación no busca únicamente permitir el acceso de empleados mediante NIP.

La decisión principal fue trasladar las reglas críticas desde el frontend hacia PostgreSQL y Supabase Auth.

El frontend se considera un cliente no confiable para efectos de autorización.

Por lo tanto:

```text
Frontend
   │
   │ solicita operación
   ▼
Supabase Auth
   │
   │ identidad + JWT
   ▼
RLS / funciones / triggers
   │
   ▼
PostgreSQL
   │
   ▼
datos autorizados

El frontend puede facilitar la experiencia de usuario, pero no determina por sí mismo:

qué rol tiene un usuario;
qué organización puede consultar;
qué sucursal puede utilizar;
qué registros puede modificar;
qué información sensible puede visualizar.
25. Principio de mínimo privilegio

La configuración sigue el principio de:

Cada usuario debe recibir únicamente los permisos necesarios para realizar su función.

Por este motivo:

ADMIN

Puede operar globalmente dentro de las capacidades administrativas definidas.

CASHIER

Está limitado al contexto operativo de su organización y sucursal.

ANON

No tiene acceso directo a las tablas internas del ERP.

Service Role

Se mantiene reservado para operaciones backend que requieren privilegios elevados.

26. Separación entre autenticación y autorización

La autenticación responde:

¿Quién es este usuario?

La autorización responde:

¿Qué puede hacer este usuario?

La arquitectura utiliza Supabase Auth para la identidad y JWT/RLS para la autorización.

El hecho de que un usuario pueda iniciar sesión no significa que tenga acceso global a los datos.

El rol y el contexto organizacional se utilizan posteriormente para determinar sus permisos.

27. Uso de funciones SECURITY DEFINER

Se utilizaron funciones SECURITY DEFINER cuando una operación necesita realizar una comprobación o acceder a información que el usuario final no debe consultar directamente.

Entre ellas se encuentran:

verify_employee_pin
provision_employee
is_same_branch
is_same_organization
is_same_org_and_branch
can_insert_audit_count
get_pos_products
¿Por qué?

Permite encapsular operaciones sensibles y evitar que el frontend necesite permisos directos sobre información interna.

Estas funciones deben mantener:

SET search_path = public

cuando corresponde y deben validar explícitamente el contexto del usuario.

La intención es que SECURITY DEFINER sea utilizado como mecanismo controlado y no como una forma de abrir acceso general.

28. Auditoría de permisos anon

Durante la revisión se descubrió que varias tablas conservaban privilegios SQL heredados para anon.

Esto se consideró innecesario porque el ERP requiere autenticación para acceder a sus datos internos.

Se aplicó:

REVOKE ALL
ON ALL TABLES IN SCHEMA public
FROM anon;

y:

REVOKE ALL
ON ALL SEQUENCES IN SCHEMA public
FROM anon;

También se configuraron privilegios por defecto para evitar que futuras tablas o secuencias vuelvan a recibir permisos para anon.

La validación final devolvió:

0 rows

para los privilegios de tablas del rol anon.

29. Excepción: funciones de autenticación

No se revocaron indiscriminadamente los permisos EXECUTE de todas las funciones públicas.

Esto fue una decisión deliberada.

El flujo de autenticación mediante NIP puede requerir una función antes de que exista una sesión autenticada.

Por ejemplo:

verify_employee_pin

puede formar parte del proceso de validación inicial.

Por eso se separaron:

Acceso a tablas

de:

Ejecución de funciones específicas

El rol anon no tiene acceso a las tablas internas, pero las funciones que deban participar en el proceso de autenticación se controlan individualmente.

30. Protección de información sensible

Se identificaron campos que no son necesarios para la operación del CASHIER.

En particular:

products.cost_price
products.box_price

No se exponen mediante la interfaz POS.

La solución fue evitar otorgar al CASHIER acceso directo a products únicamente para consultar el catálogo.

En su lugar:

products
   │
   ├── información interna
   │
   └── datos operativos
          │
          ▼
   get_pos_products()
          │
          ▼
       CASHIER

La función devuelve únicamente las columnas necesarias.

31. Protección contra manipulación desde el frontend

Una regla fundamental de esta implementación es:

Los datos enviados por el frontend no deben considerarse confiables.

Por ejemplo, durante una auditoría el frontend envía:

counted_stock

pero no controla:

expected_stock
difference

Estos valores se calculan en PostgreSQL.

De manera similar, un CASHIER puede enviar un session_id, pero la función:

can_insert_audit_count()

comprueba que esa sesión pertenece realmente a:

el usuario;
la organización;
la sucursal.

Por lo tanto, conocer un UUID no es suficiente para obtener acceso.

32. Relación entre RLS y funciones

RLS continúa siendo la primera línea de autorización a nivel de tabla.

Las funciones de seguridad se utilizan cuando una validación requiere consultar relaciones que el usuario no debería poder consultar directamente.

Ejemplo:

CASHIER
   │
   └── INSERT audit_counts
             │
             ▼
      can_insert_audit_count()
             │
             ▼
       audit_sessions

El CASHIER no necesita acceso libre a audit_sessions para que PostgreSQL pueda comprobar la relación.

La función encapsula esa comprobación.

33. Relación entre RLS y triggers

Los triggers se utilizan para reglas que deben ejecutarse automáticamente al modificar datos.

En auditoría:

INSERT audit_counts
        │
        ▼
BEFORE INSERT
        │
        ▼
trg_audit_counts_difference
        │
        ├── expected_stock
        └── difference

Esto evita depender del frontend para realizar cálculos que afectan la integridad de la información.

La diferencia entre ambos mecanismos queda así:

RLS
→ ¿puede el usuario realizar la operación?

Trigger
→ ¿cómo debe procesarse el dato antes de guardarlo?
34. Validación final de RLS

Se ejecutó una auditoría sobre las tablas públicas.

El resultado confirmó:

rowsecurity = true

para todas las tablas revisadas.

Entre ellas:

audit_counts
audit_sessions
branch_fixed_costs
branch_inventory
branch_settings
branches
catalog_types
catalog_values
employee_credentials
expense_attachments
expenses
external_sales_report_items
external_sales_reports
foodbot_mappings
inventory_movements
notifications
organizations
payments
products
profile_roles
profiles
purchase_order_items
purchase_orders
roles
sale_items
sales
suppliers
transfer_order_items
transfer_orders
waste_items
waste_records

Esto confirma que las tablas no dependen únicamente de controles realizados por el frontend.

35. Políticas abiertas detectadas y evaluadas

Durante la auditoría final se buscaron políticas con:

USING (true)

o:

WITH CHECK (true)

El resultado mostró únicamente:

catalog_types
catalog_values

con políticas de lectura para usuarios autenticados.

Estas políticas corresponden a catálogos de referencia y no representan operaciones abiertas de escritura sobre datos sensibles.

No se encontraron políticas anon durante la validación final.

36. Estado final de roles

La separación esperada queda documentada como:

┌─────────────────────────────────────┐
│              ADMIN                  │
├─────────────────────────────────────┤
│ Organización global                 │
│ Acceso administrativo               │
│ Gestión de sucursales               │
│ Gestión de empleados                │
│ Inventario                          │
│ Reportes                            │
│ Auditorías                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│             CASHIER                 │
├─────────────────────────────────────┤
│ Organización propia                │
│ Sucursal propia                    │
│ Gastos                             │
│ Ventas                             │
│ Auditorías                         │
│ Mermas                             │
│ Operación de sucursal              │
│ Sin acceso global                  │
│ Sin lectura de conteos ciegos      │
│ Sin costos internos de productos   │
└─────────────────────────────────────┘
37. Archivos asociados

Los scripts desarrollados durante esta implementación deben conservarse dentro del repositorio de Supabase para que la base de datos pueda reproducirse y auditarse.

La estructura relevante queda organizada conceptualmente como:

Supabase/
└── schema/
    ├── functions/
    │   ├── catalog/
    │   │   ├── 001-get_pos_products.sql
    │   │   └── 002-restrict-get-pos-products.sql
    │   │
    │   └── security/
    │       └── funciones de autenticación y autorización
    │
    ├── rls/
    │   └── jwt/
    │       └── 008-audit-counts-security.sql
    │
    └── security/
        └── 001-revoke-anon-table-access.sql

Los nombres y ubicaciones deben mantenerse sincronizados con el repositorio real antes de realizar el commit definitivo.

38. Resultado de la implementación

La asignación queda técnicamente implementada con los siguientes controles:

✅ Acceso mediante NIP
✅ PIN almacenado mediante hash
✅ Provisión segura de empleados
✅ Verificación segura del PIN
✅ Roles ADMIN / CASHIER
✅ Claims JWT
✅ Organización en JWT
✅ Sucursal en JWT
✅ Validación de organización
✅ Validación de sucursal
✅ RLS en tablas públicas
✅ Eliminación de acceso de tablas para anon
✅ Auditoría ciega
✅ Validación de sesión de auditoría
✅ Cálculo backend de expected_stock
✅ Cálculo backend de difference
✅ Protección del inventario teórico
✅ Catálogo POS limitado
✅ Costos internos fuera de la respuesta POS
✅ RPC POS protegida
39. Decisión final

La decisión adoptada es mantener una arquitectura donde:

Frontend
    ↓
solicita
    ↓
Supabase Auth
    ↓
JWT
    ↓
RLS / funciones / triggers
    ↓
PostgreSQL

El frontend proporciona la experiencia de usuario, pero las restricciones importantes se aplican en el backend.

Esto permite que las reglas de seguridad continúen funcionando incluso si alguien intenta utilizar directamente la API de Supabase, modificar las peticiones del navegador o ignorar las validaciones visuales del frontend.

40. Criterio de cierre

La asignación se considera cerrada cuando:

✅ El código SQL está almacenado en el repositorio.
✅ Las migraciones/scripts utilizados están documentados.
✅ Los cambios fueron ejecutados en Supabase.
✅ RLS está habilitado.
✅ anon no tiene acceso directo a las tablas.
✅ ADMIN mantiene acceso administrativo.
✅ CASHIER está limitado por organización y sucursal.
✅ La auditoría ciega no expone el stock teórico.
✅ Las diferencias se calculan en PostgreSQL.
✅ Los costos internos no se exponen al POS.

La implementación queda preparada para continuar con las pruebas de integración del frontend y posteriormente con una revisión de seguridad específica de producción.

41. Nota de seguridad

Esta implementación establece controles de autorización, aislamiento y protección de datos a nivel de Supabase/PostgreSQL.

No debe interpretarse como una garantía de seguridad absoluta.

Antes del despliegue productivo todavía deben revisarse, según corresponda:

configuración de Supabase Auth;
Edge Functions;
secretos y variables de entorno;
Storage;
políticas de Storage;
configuración de producción;
manejo de sesiones;
recuperación de cuentas;
rate limiting;
monitoreo;
auditoría de logs;
pruebas de penetración.

La decisión arquitectónica es que estas capas complementen, y no sustituyan, las reglas RLS y validaciones implementadas en la base de datos.