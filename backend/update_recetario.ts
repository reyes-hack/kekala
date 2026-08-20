import { supabase } from './src/infrastructure/database/supabaseClient';

async function run() {
    console.log("Updating coberturas and rellenos to 20ml...");
    const { data, error } = await supabase
        .from('foodbot_mappings')
        .update({ deduction_quantity: 20 })
        .or('foodbot_name.ilike.%cobertura%,foodbot_name.ilike.%relleno%');

    if (error) {
        console.error("Error updating:", error);
    } else {
        console.log("Update successful. Affected rows:", data);
    }
}

run();
