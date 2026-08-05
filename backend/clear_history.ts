import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function clearHistory() {
    const { data, error } = await supabase
        .from('inventory_movements')
        .delete()
        .not('id', 'is', null);

    if (error) {
        console.error('Error al borrar el historial:', error);
    } else {
        console.log('Historial de movimientos borrado por completo.');
    }
}

clearHistory();
