import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load variables from backend .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // Esto busca en backend/.env

// Polyfill WebSocket para Node.js < 22
const ws = require('ws');
if (typeof global !== 'undefined') {
  (global as any).WebSocket = ws;
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''; 

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ No se encontraron las credenciales de Supabase en el archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});
