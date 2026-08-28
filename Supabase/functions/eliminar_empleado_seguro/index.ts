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

    const body = await req.json()
    const { target_user_id } = body

    if (!target_user_id) {
      throw new Error('Falta el parámetro target_user_id')
    }

    // Auth Admin Verification
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: adminUser }, error: verifyError } = await supabaseClient.auth.getUser(token)
    
    if (verifyError || !adminUser) {
      throw new Error('No autorizado: Token inválido')
    }

    // Ensure it's an admin 
    const { data: adminProfileRoles } = await supabaseClient
      .from('profile_roles')
      .select('roles(code)')
      .eq('profile_id', adminUser.id)
      
    const isAdmin = adminProfileRoles?.some(pr => pr.roles?.code === 'ADMIN')
    if (!isAdmin) {
      throw new Error('Solo un administrador puede revocar empleados')
    }

    // Ensure they don't delete themselves
    if (adminUser.id === target_user_id) {
      throw new Error('No puedes eliminar tu propia cuenta de administrador')
    }

    // SOFT DELETE: Preservar historial de ventas/operaciones pero bloquear acceso
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ is_active: false })
      .eq('id', target_user_id)

    if (profileError) throw profileError

    // Eliminar credenciales para que no pueda entrar por NIP
    const { error: credsError } = await supabaseClient
      .from('employee_credentials')
      .delete()
      .eq('profile_id', target_user_id)

    if (credsError) throw credsError

    // Banear en Supabase Auth por seguridad (100 años)
    const { error: banError } = await supabaseClient.auth.admin.updateUserById(
      target_user_id, 
      { ban_duration: '876000h' }
    )

    if (banError) throw banError

    return new Response(
      JSON.stringify({ success: true, message: 'Empleado revocado y eliminado correctamente' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Catch block error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
