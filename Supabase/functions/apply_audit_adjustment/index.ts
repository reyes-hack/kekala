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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await req.json().catch(() => ({}))
    const { session_id, branch_id, organization_id, adjustments } = body
    // adjustments: [{ product_id, counted_stock, difference }]

    if (!session_id || !branch_id || !adjustments || !Array.isArray(adjustments)) {
      throw new Error('Missing required fields')
    }

    const errors = []
    for (const item of adjustments) {
      if (item.difference === 0) continue

      // 1. Insert inventory movement
      const { error: moveErr } = await supabase.from('inventory_movements').insert({
        organization_id,
        branch_id,
        product_id: item.product_id,
        movement_type: item.difference > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
        quantity: Math.abs(item.difference),
        reference_type: 'AUDIT',
        reference_id: session_id,
        notes: `Ajuste por Auditoría ${session_id.split('-')[0]}`
      })
      if (moveErr) errors.push({ product_id: item.product_id, step: 'movement', error: moveErr.message })

      // 2. Directly set the stock to the counted value (absolute, not relative)
      // This ensures the stock is exactly what was counted regardless of trigger state
      const { error: stockErr } = await supabase
        .from('branch_inventory')
        .upsert({
          organization_id,
          branch_id,
          product_id: item.product_id,
          current_stock: item.counted_stock,
          updated_at: new Date().toISOString()
        }, { onConflict: 'branch_id,product_id' })
      
      if (stockErr) {
        console.error('Error upserting branch_inventory:', stockErr)
        errors.push({ product_id: item.product_id, step: 'stock', error: stockErr.message })
      }
    }

    if (errors.length > 0) {
      throw new Error('Errors occurred during adjustment: ' + JSON.stringify(errors))
    }

    // Mark audit session as adjusted
    await supabase
      .from('audit_sessions')
      .update({ status: 'ADJUSTED' })
      .eq('id', session_id)

    return new Response(JSON.stringify({ ok: true, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('apply_audit_adjustment error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
