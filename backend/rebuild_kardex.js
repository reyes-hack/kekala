const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'c:/Users/toro5/Documents/AZSA/KEKALA/backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function rebuild() {
    const { data: product } = await supabase.from('products').select('id').eq('product_code', 'PALETA_ORIG_FRESA').single();
    const { data: branch } = await supabase.from('branches').select('id, organization_id').eq('name', 'Américas Veracruz').single();
    const { data: moveTypeValues } = await supabase.from('catalog_values').select('id, code').eq('code', 'SALE');
    const moveType = moveTypeValues[0]; // Assuming SALE

    // 1. Borrar todas las ventas de Foodbot de este producto y sucursal
    await supabase.from('inventory_movements').delete()
        .eq('product_id', product.id)
        .eq('branch_id', branch.id)
        .like('notes', '%Foodbot Delta%');

    // 2. Borrar las compensaciones de ajuste que hicimos hace rato
    await supabase.from('inventory_movements').delete()
        .eq('product_id', product.id)
        .eq('branch_id', branch.id)
        .like('notes', '%Compensación automática por doble resta%');

    // 3. Forzar el inventario a 288 (Ajuste Inicial de auditoria) para que arranque limpio
    await supabase.from('branch_inventory').update({ current_stock: 288 }).eq('product_id', product.id).eq('branch_id', branch.id);

    // 4. Insertar secuencialmente las ventas correctas
    const ventas = [
        { date: '2026-08-19T23:00:00Z', qty: -3 },
        { date: '2026-08-20T23:00:00Z', qty: -5 },
        { date: '2026-08-21T23:00:00Z', qty: -4 },
        { date: '2026-08-22T23:00:00Z', qty: -14 },
        { date: '2026-08-23T23:00:00Z', qty: -14 },
        { date: '2026-08-24T23:00:00Z', qty: -5 },
        { date: '2026-08-25T23:00:00Z', qty: -6 }
    ];

    for (const v of ventas) {
        // En PostgreSQL el trigger de AFTER INSERT calculará el stock correctamente 
        // si lo insertamos de a uno (sin bulk)
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
    
    // Validate final stock
    const { data: finalInv } = await supabase.from('branch_inventory').select('current_stock').eq('product_id', product.id).eq('branch_id', branch.id).single();
    console.log(`Kardex reconstruido! Final stock en BD: ${finalInv.current_stock} (Debería ser 237)`);
}
rebuild();
