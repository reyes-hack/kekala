import { supabase } from './src/infrastructure/database/supabaseClient';

async function run() {
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    console.log(data, error);
}

run();
