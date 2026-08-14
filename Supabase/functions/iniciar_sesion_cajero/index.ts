import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await req.json().catch(() => ({}))
    const { profile_id, pin } = body

    if (!profile_id || !pin) {
      throw new Error('Faltan credenciales (profile_id, pin)')
    }

    // 1. Verificar el PIN llamando al RPC (el RPC usa pgcrypto internamente)
    const { data: isValid, error: rpcError } = await supabaseClient.rpc('verify_employee_pin', {
      p_profile_id: profile_id,
      p_pin: pin
    })

    if (rpcError) throw rpcError
    if (!isValid) {
      throw new Error('NIP Incorrecto')
    }

    // 2. Si el PIN es válido, procedemos a generar una sesión válida en Supabase Auth
    // Primero, obtenemos el usuario para conocer su email sintético
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(profile_id)
    if (userError || !userData?.user) {
      throw new Error('No se encontró el usuario en Auth')
    }

    const email = userData.user.email

    // 2.5 Obtener el perfil del empleado para inyectar branch_id y organization_id
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('branch_id, organization_id')
      .eq('id', profile_id)
      .single()

    // 3. Actualizamos su contraseña Y escribimos branch_id/org_id en app_metadata
    const tempPassword = crypto.randomUUID() + '!A1'
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(profile_id, { 
      password: tempPassword,
      app_metadata: {
        ...(userData.user.app_metadata || {}),
        branch_id: profileData?.branch_id || null,
        organization_id: profileData?.organization_id || null
      }
    })
    
    if (updateError) throw updateError

    // 4. Iniciamos sesión con la nueva contraseña para obtener un JWT fresco (con claims del JWT hook)
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: tempPassword
    })

    if (loginError || !loginData?.session) {
      throw new Error('Fallo al generar la sesión JWT')
    }

    // 5. Devolvemos la sesión al cliente
    return new Response(JSON.stringify({ session: loginData.session }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Catch block error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
