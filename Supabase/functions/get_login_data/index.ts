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
    // Create a Supabase client with the service role key to bypass RLS
    // This allows anonymous users (cashiers) to fetch the list of branches and employees securely.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await req.json().catch(() => ({}))
    const { branch_id } = body

    if (!branch_id) {
      // Return active branches
      const { data: branches, error } = await supabaseClient
        .from('branches')
        .select('id, code, name, organization_id')
        .eq('is_active', true)
        .order('name');
        
      if (error) throw error;
      
      return new Response(JSON.stringify({ branches }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    } else {
      // Return employees for the specified branch
      const { data: employees, error } = await supabaseClient
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          display_name,
          profile_roles(
            roles(code)
          )
        `)
        .eq('branch_id', branch_id)
        .eq('is_active', true)
        .order('first_name');
        
      if (error) throw error;
      
      const formatted = employees.map(emp => ({
        id: emp.id,
        displayName: emp.display_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Usuario Sin Nombre',
        role: emp.profile_roles?.[0]?.roles?.code || 'CASHIER'
      }));
      
      return new Response(JSON.stringify({ employees: formatted }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

  } catch (error) {
    console.error('Catch block error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
