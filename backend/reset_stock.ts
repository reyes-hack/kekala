import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function reset() {
    const { data: products, error } = await supabase.from('products').select('id, unit_id');
    const { data: catalog, error: err2 } = await supabase.from('catalog_values').select('id, name');

    if (error || err2) {
        console.error('Error fetching products/catalog:', error || err2);
        return;
    }

    const unitMap = {};
    for (const c of catalog) unitMap[c.id] = c.name;

    for (const p of products) {
        const unitName = unitMap[p.unit_id];
        
        let stock = 100;
        let min = 50;

        if (unitName === 'Mililitro') {
            stock = 5000;
            min = 1000;
        } else if (unitName === 'Gramo') {
            stock = 5000;
            min = 1000;
        }

        const { error: updErr } = await supabase
            .from('branch_inventory')
            .update({ current_stock: stock, minimum_stock: min, maximum_stock: null })
            .eq('product_id', p.id);

        if (updErr) {
            console.error(`Error updating product ${p.id}:`, updErr);
        } else {
            console.log(`Updated product ${p.id} to stock ${stock} (Unit: ${unitName})`);
        }
    }
    console.log('Stock reseteado a estándar (100 pzas / 5000 ml)');
}

reset();
