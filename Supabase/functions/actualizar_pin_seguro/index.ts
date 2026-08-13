import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

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
    const { target_user_id, new_pin } = body

    if (!target_user_id || !new_pin || new_pin.length !== 6) {
      throw new Error('Faltan parámetros requeridos o PIN inválido')
    }

    // Auth Admin Verification
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: adminUser }, error: verifyError } = await supabaseClient.auth.getUser(token)
    
    if (verifyError || !adminUser) {
      throw new Error('No autorizado: Token inválido')
    }

    // Ensure it's an admin (Optional but recommended extra check: verify role=ADMIN)
    const { data: adminProfileRoles } = await supabaseClient
      .from('profile_roles')
      .select('roles(code)')
      .eq('profile_id', adminUser.id)
      
    const isAdmin = adminProfileRoles?.some(pr => pr.roles?.code === 'ADMIN')
    if (!isAdmin) {
      throw new Error('Solo un administrador puede cambiar NIPs')
    }

    // Hash the new PIN
    const hashedPin = bcrypt.hashSync(new_pin)

    // Update the credentials table bypassing RLS
    const { error: updateError } = await supabaseClient
      .from('employee_credentials')
      .update({ pin_hash: hashedPin, updated_at: new Date().toISOString() })
      .eq('profile_id', target_user_id)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ success: true, message: 'NIP actualizado correctamente' }),
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
