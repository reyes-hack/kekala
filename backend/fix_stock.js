const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'c:/Users/toro5/Documents/AZSA/KEKALA/backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
    const { data: product } = await supabase.from('products').select('id').eq('product_code', 'PALETA_ORIG_FRESA').single();
    const { data: branch } = await supabase.from('branches').select('id').eq('name', 'Américas Veracruz').single();
    
    // Forzar el stock a 237 como manda la realidad de Foodbot
    await supabase.from('branch_inventory').update({ current_stock: 237 }).eq('product_id', product.id).eq('branch_id', branch.id);
    console.log('Stock for PALETA_ORIG_FRESA in Américas Veracruz forced to 237.');
}
fix();
