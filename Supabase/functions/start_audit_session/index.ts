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
    const { id, branch_id, started_by } = body

    if (!branch_id || !started_by) {
      throw new Error('Missing required fields: branch_id or started_by')
    }

    // Auto-fetch organization_id to prevent missing field errors if frontend doesn't have it
    const { data: branchData, error: branchErr } = await supabaseClient
      .from('branches')
      .select('organization_id')
      .eq('id', branch_id)
      .single()

    if (branchErr || !branchData) {
      throw new Error('Branch not found or organization missing')
    }

    const organization_id = branchData.organization_id;

    let sessionData;
    const { data, error } = await supabaseClient
      .from('audit_sessions')
      .insert({
        id: id || crypto.randomUUID(),
        organization_id,
        branch_id,
        started_by,
        status: 'IN_PROGRESS'
      })
      .select()
      .single()

    if (error) {
      // If a session already exists for this branch (uq_active_audit_session violation)
      if (error.message.includes('duplicate key') || error.code === '23505') {
        const { data: existingData, error: existingErr } = await supabaseClient
          .from('audit_sessions')
          .select('*')
          .eq('branch_id', branch_id)
          .eq('status', 'IN_PROGRESS')
          .single()
          
        if (existingErr) throw existingErr;
        sessionData = existingData;
      } else {
        throw error;
      }
    } else {
      sessionData = data;
    }

    // Fetch all active products to bypass RLS for cashiers
    const { data: productsData, error: productsError } = await supabaseClient
      .from('products')
      .select('id, name, is_active, unit:catalog_values!unit_id(name)')
      .eq('is_active', true)
      .order('name');

    return new Response(JSON.stringify({ 
      session: sessionData,
      products: productsData,
      debug_error: productsError
    }), {
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
