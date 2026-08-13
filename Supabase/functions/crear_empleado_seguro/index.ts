import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Inicializar el cliente Supabase con la llave SERVICE_ROLE
    // Esto es crucial para poder crear usuarios saltando las reglas RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Obtener los datos del body enviados desde el frontend
    const body = await req.json()
    const { full_name, pin_code, role, branch_id } = body

    if (!full_name || !pin_code || !role) {
      throw new Error('Faltan parámetros requeridos: full_name, pin_code, role')
    }

    // Obtener el organization_id del token del Administrador que está llamando a esta función
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: adminUser }, error: verifyError } = await supabaseClient.auth.getUser(token)
    
    if (verifyError || !adminUser) {
      throw new Error('No autorizado: Token inválido')
    }
    
    const adminId = adminUser.id;

    // Obtener organization_id directamente de la tabla profiles (más seguro que leer del JWT)
    const { data: adminProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('organization_id')
      .eq('id', adminId)
      .single()

    if (profileError || !adminProfile) {
      throw new Error('No se pudo cargar el perfil del administrador')
    }

    const organization_id = adminProfile.organization_id
    if (!organization_id) {
      throw new Error('El administrador no tiene organization_id asignado en su perfil')
    }

    // Buscar el UUID del rol usando el código ('CASHIER', 'ADMIN')
    const { data: roleData, error: roleSearchError } = await supabaseClient
      .from('roles')
      .select('id')
      .eq('code', role)
      .single()

    if (roleSearchError || !roleData) {
      throw new Error(`Rol inválido: ${role}`)
    }

    const role_id = roleData.id

    // 1. Crear el usuario en auth.users con un correo sintético (basado en timestamp para evitar choques)
    const syntheticEmail = `emp_${Date.now()}@kekala.local`
    
    // Generar una contraseña fuerte aleatoria, el empleado no la usará directamente (usará su NIP)
    const strongPassword = crypto.randomUUID() + '!A1'

    console.log(`Creando auth.user para empleado: ${syntheticEmail}`)

    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: syntheticEmail,
      password: strongPassword,
      email_confirm: true,
      user_metadata: { name: full_name }
    })

    if (authError) {
      console.error('Error al crear auth.user:', authError)
      throw authError
    }

    const userId = authData.user.id
    console.log(`Usuario creado exitosamente. UUID: ${userId}`)

    // 2. Llamar a la función de provisionamiento RPC en Postgres
    console.log(`Llamando RPC provision_employee para UUID: ${userId}`)
    
    // IMPORTANTE: Generar el hash del NIP usando bcrypt (la DB exige un hash bcrypt, no texto plano)
    // El salt default en deno.land/x/bcrypt/mod.ts es 10 rounds
    const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts")
    const hashedPin = bcrypt.hashSync(pin_code)

    const { data: rpcData, error: rpcError } = await supabaseClient.rpc('provision_employee', {
      p_user_id: userId,
      p_organization_id: organization_id,
      p_branch_id: role === 'ADMIN' ? null : branch_id,
      p_full_name: full_name,
      p_pin_hash: hashedPin, // Pasamos el Hash válido!
      p_role_id: role_id
    })

    if (rpcError) {
      console.error('Error en RPC provision_employee:', rpcError)
      
      // Intentar limpiar el usuario basura si falló la provisión
      await supabaseClient.auth.admin.deleteUser(userId)
      
      throw rpcError
    }

    // 3. Devolver éxito
    return new Response(
      JSON.stringify({ success: true, message: 'Empleado creado correctamente', user_id: userId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Catch block error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
