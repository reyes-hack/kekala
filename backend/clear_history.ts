import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function clearHistory() {
    console.log('Borrando historial de inventario...');
    await supabase.from('inventory_movements').delete().not('id', 'is', null);
    
    console.log('Borrando historial de pagos y ventas...');
    await supabase.from('payments').delete().not('id', 'is', null);
    await supabase.from('sales').delete().not('id', 'is', null);

    console.log('Borrando historial analítico...');
    await supabase.from('external_sales_report_items').delete().not('id', 'is', null);
    await supabase.from('external_sales_reports').delete().not('id', 'is', null);

    console.log('¡Todo el historial ha sido borrado por completo!');
}

clearHistory();
