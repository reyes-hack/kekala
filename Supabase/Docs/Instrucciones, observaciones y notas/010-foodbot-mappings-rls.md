# Sincronización de Tabla de Mapeos (Foodbot) y Políticas RLS

Hola Ángel,

Acabo de terminar de diseñar e incorporar la tabla de equivalencias (Recetario / BOM) para la deducción automatizada del inventario a partir de los datos que extraemos de Foodbot.

Con esto cubrimos la solicitud de KEKALA de poder modificar los factores de consumo (cuántos mililitros se gastan por cobertura, o piezas por caja) directamente desde la base de datos, además de aprovechar el sistema de Catálogos (Categorías y Unidades) que ya habías dejado súper bien estructurado en la tabla `products`.

### Pasos a sincronizar en tu entorno:

1. **Nueva Tabla de Inventario:**
   Ya subí el script de creación: `schema/tables/inventory/004-foodbot_mappings.sql`. Por favor, córrelo en tu base de datos para levantar la tabla y sus llaves foráneas.

2. **Políticas RLS (Solo Lectura/Escritura Administrativa):**
   Como esta tabla va a ser leída constantemente por nuestro backend (para hacer la matemática de deducción de ventas) y por el frontend (cuando KEKALA quiera agregar/editar recetas en el módulo de Inventario), necesitamos habilitar su acceso público al igual que hicimos con los catálogos.

   Por favor, ejecuta estas políticas en tu base de datos para que no se nos caigan las peticiones por error 401:

   ```sql
   -- Permitir lectura publica de las recetas/mapeos
   CREATE POLICY "Permitir lectura publica de mapeos de foodbot" 
   ON public.foodbot_mappings 
   FOR SELECT 
   USING (true);

   -- Permitir insercion publica para agregar nuevas equivalencias
   CREATE POLICY "Permitir insercion publica de mapeos de foodbot" 
   ON public.foodbot_mappings 
   FOR INSERT 
   WITH CHECK (true);

   -- Permitir actualizacion publica para que cambien las cantidades (ej. 0.05 a 0.08)
   CREATE POLICY "Permitir actualizacion publica de mapeos de foodbot" 
   ON public.foodbot_mappings 
   FOR UPDATE 
   USING (true)
   WITH CHECK (true);
   ```

Con esto quedamos sincronizados en la capa de datos y listos para arrancar con el endpoint del `InventorySyncService` en el backend.

¡Un saludo!
