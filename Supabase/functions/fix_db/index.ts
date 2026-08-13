import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import * as postgres from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const databaseUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!databaseUrl) {
      throw new Error("SUPABASE_DB_URL is not set");
    }
    
    // Configurar conexión a la base de datos
    const pool = new postgres.Pool(databaseUrl, 1, true);
    const connection = await pool.connect();
    
    try {
      await connection.queryObject`
        DROP POLICY IF EXISTS "audit_sessions_cashier_select" ON public.audit_sessions;
      `;
      
      await connection.queryObject`
        CREATE POLICY "audit_sessions_cashier_select"
        ON public.audit_sessions
        FOR SELECT
        TO authenticated
        USING (
            public.has_jwt_role('CASHIER')
            AND started_by = auth.uid()
        );
      `;
      
    } finally {
      connection.release();
    }

    return new Response(JSON.stringify({ success: true, message: "Policy created!" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
