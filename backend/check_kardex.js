const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:/Users/toro5/Documents/AZSA/KEKALA/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkKardex() {
    // 1. Get product ID
    const { data: product } = await supabase
        .from('products')
        .select('id, name')
        .eq('product_code', 'PALETA_ORIG_YOGURT')
        .single();
        
    if (!product) {
        console.log('Product not found');
        return;
    }
    
    // 2. Get movements
    const { data: movements } = await supabase
        .from('inventory_movements')
        .select(`
            created_at,
            quantity,
            notes,
            movement_type:movement_types!movement_type_id(code)
        `)
        .eq('product_id', product.id)
        .order('created_at', { ascending: true });
        
    console.log(`Movements for ${product.name} (PALETA_ORIG_FRESA):`);
    let cumulative = 0;
    
    // Wait, movement_type might be catalog_values
    const { data: movementsCatalog } = await supabase
        .from('inventory_movements')
        .select(`
            created_at,
            quantity,
            notes,
            movement_type:catalog_values!movement_type_id(code),
            branch:branches!branch_id(name)
        `)
        .eq('product_id', product.id)
        .order('branch_id', { ascending: true })
        .order('created_at', { ascending: true });

    let actualMovements = movementsCatalog;
    
    let currentBranch = '';
    for (const m of actualMovements) {
        if (m.branch?.name !== currentBranch) {
            currentBranch = m.branch?.name;
            cumulative = 0;
            console.log(`\n--- Branch: ${currentBranch} ---`);
        }
        cumulative += Number(m.quantity);
        console.log(`[${new Date(m.created_at).toISOString()}] [${m.movement_type?.code || 'UNKNOWN'}] Qty: ${m.quantity} | Total: ${cumulative} | Notes: ${m.notes}`);
    }
}

checkKardex();
