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
    const { session_id, branch_id, adjustments } = body
    // adjustments: [{ product_id, counted_stock, difference }]

    if (!session_id || !branch_id || !adjustments || !Array.isArray(adjustments)) {
      throw new Error('Missing required fields: session_id, branch_id, or adjustments')
    }

    // Securely query organization_id to avoid relying on frontend sending it
    const { data: branchData, error: branchErr } = await supabase
      .from('branches')
      .select('organization_id')
      .eq('id', branch_id)
      .single()

    if (branchErr || !branchData) {
      throw new Error('Branch not found or organization_id missing in DB: ' + (branchErr?.message || ''))
    }
    const organization_id = branchData.organization_id

    const errors = []
    for (const item of adjustments) {
      // Get real current stock at this exact moment
      const { data: stockData, error: fetchStockErr } = await supabase
        .from('branch_inventory')
        .select('current_stock')
        .eq('organization_id', organization_id)
        .eq('branch_id', branch_id)
        .eq('product_id', item.product_id)
        .maybeSingle()

      if (fetchStockErr) {
        console.error('Error fetching stock:', fetchStockErr)
        errors.push({ product_id: item.product_id, step: 'fetch', error: fetchStockErr.message })
        continue
      }

      const current_stock = stockData?.current_stock ?? 0
      const real_difference = item.counted_stock - current_stock

      if (real_difference === 0) continue

      // 1. Insert inventory movement with EXACT difference to reach counted_stock
      // The trigger will automatically update branch_inventory.current_stock
      const { error: moveErr } = await supabase.from('inventory_movements').insert({
        organization_id,
        branch_id,
        product_id: item.product_id,
        movement_type_id: '7d9cc151-6aba-4545-ac53-17362d02293e', // ADJUSTMENT
        quantity: real_difference, 
        reference_type: 'AUDIT',
        reference_id: session_id,
        notes: `Ajuste por Auditoría: Inventario real de ${current_stock} a ${item.counted_stock} (Diferencia: ${real_difference > 0 ? '+' : ''}${real_difference})`
      })
      if (moveErr) {
        console.error('Error inserting inventory movement:', moveErr)
        errors.push({ product_id: item.product_id, step: 'movement', error: moveErr.message })
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
