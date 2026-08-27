const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'c:/Users/toro5/Documents/AZSA/KEKALA/backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function rebuildYogurt() {
    const { data: product } = await supabase.from('products').select('id').eq('product_code', 'PALETA_ORIG_YOGURT').single();
    const { data: moveTypeValues } = await supabase.from('catalog_values').select('id, code').eq('code', 'SALE');
    const moveType = moveTypeValues[0];

    const data = {
        'Américas Veracruz': [
            { date: '2026-08-19T23:00:00Z', qty: -16 },
            { date: '2026-08-20T23:00:00Z', qty: -22 },
            { date: '2026-08-21T23:00:00Z', qty: -16 },
            { date: '2026-08-22T23:00:00Z', qty: -24 },
            { date: '2026-08-23T23:00:00Z', qty: -30 },
            { date: '2026-08-24T23:00:00Z', qty: -5 },
            { date: '2026-08-25T23:00:00Z', qty: -11 }
        ],
        'El Dorado Veracruz': [
            { date: '2026-08-19T23:00:00Z', qty: -14 },
            { date: '2026-08-20T23:00:00Z', qty: -17 },
            { date: '2026-08-21T23:00:00Z', qty: -11 },
            { date: '2026-08-22T23:00:00Z', qty: -25 },
            { date: '2026-08-23T23:00:00Z', qty: -47 },
            { date: '2026-08-24T23:00:00Z', qty: -11 },
            { date: '2026-08-25T23:00:00Z', qty: -16 }
        ]
    };

    for (const [branchName, ventas] of Object.entries(data)) {
        const { data: branch } = await supabase.from('branches').select('id, organization_id').eq('name', branchName).single();
        
        // 1. Borrar basura
        await supabase.from('inventory_movements').delete().eq('product_id', product.id).eq('branch_id', branch.id).like('notes', '%Foodbot Delta%');
        await supabase.from('inventory_movements').delete().eq('product_id', product.id).eq('branch_id', branch.id).like('notes', '%Compensación automática por doble resta%');

        // 2. Resetear stock a inicial
        const initialStock = branchName === 'Américas Veracruz' ? 264 : 288;
        await supabase.from('branch_inventory').update({ current_stock: initialStock }).eq('product_id', product.id).eq('branch_id', branch.id);

        // 3. Insertar secuencialmente
        for (const v of ventas) {
            await supabase.from('inventory_movements').insert({
                organization_id: branch.organization_id,
                branch_id: branch.id,
                product_id: product.id,
                movement_type_id: moveType.id,
                quantity: v.qty,
                notes: `Modificador Venta Foodbot Delta: ${v.date.substring(0,10)} (Corregido manual)`,
                created_at: v.date
            });
        }
        
        // 4. Validate
        const { data: finalInv } = await supabase.from('branch_inventory').select('current_stock').eq('product_id', product.id).eq('branch_id', branch.id).single();
        console.log(`Kardex reconstruido para ${branchName}! Final stock en BD: ${finalInv.current_stock}`);
    }
}
rebuildYogurt();
