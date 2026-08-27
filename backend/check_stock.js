const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'c:/Users/toro5/Documents/AZSA/KEKALA/backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: product } = await supabase.from('products').select('id, name').eq('product_code', 'PALETA_ORIG_FRESA').single();
    const { data: inventory } = await supabase.from('branch_inventory').select('current_stock, branches(name)').eq('product_id', product.id);
    console.log(inventory);
}
check();
