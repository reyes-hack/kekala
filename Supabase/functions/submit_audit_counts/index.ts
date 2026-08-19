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
    const { session_id, counts } = body
    // counts: [{ product_id, counted_stock, expected_stock, difference, evidence_photo_url }]

    if (!session_id || !counts || !Array.isArray(counts)) {
      throw new Error('Missing required fields: session_id or counts')
    }

    const errors = []
    for (const count of counts) {
      const { error } = await supabase.from('audit_counts').insert({
        session_id,
        product_id: count.product_id,
        counted_stock: count.counted_stock,
        expected_stock: count.expected_stock ?? null,
        difference: count.difference ?? null,
        evidence_photo_url: count.evidence_photo_url ?? null
      })
      if (error) errors.push({ product_id: count.product_id, error: error.message })
    }

    // Mark session as COMPLETED
    await supabase
      .from('audit_sessions')
      .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
      .eq('id', session_id)

    return new Response(JSON.stringify({ ok: true, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('submit_audit_counts error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
