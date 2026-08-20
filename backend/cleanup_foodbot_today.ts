import { supabase } from './src/infrastructure/database/supabaseClient';

async function cleanup() {
    const date = '2026-08-19';
    console.log(`Borrando movimientos de inventario de Foodbot para la fecha: ${date}...`);
    
    // 1. Delete inventory movements
    const { data: invData, error: invError } = await supabase
        .from('inventory_movements')
        .delete()
        .like('notes', `%Foodbot Delta: ${date}%`);

    if (invError) {
        console.error("Error deleting inventory movements:", invError);
    } else {
        console.log("Deleted inventory movements for today.");
    }

    // 2. Delete external sales reports (which will also delete items via cascade hopefully, if not we delete items first? Wait, no, we can just delete reports. But let's check if there is cascade).
    // Actually, InventorySyncService deletes items? No, it just deletes reports. 
    console.log(`Borrando reportes externos de Foodbot para la fecha: ${date}...`);
    const { data: repData, error: repError } = await supabase
        .from('external_sales_reports')
        .delete()
        .eq('report_date', date);

    if (repError) {
        console.error("Error deleting reports:", repError);
    } else {
        console.log("Deleted external sales reports for today.");
    }
}

cleanup();
