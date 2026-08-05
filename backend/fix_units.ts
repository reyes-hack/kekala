import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function run() {
    const { data: units } = await supabase.from('catalog_values').select('*').eq('catalog_type_id', '3a3f0c50-fa65-4219-b1b4-065703e92ca0');
    console.log("Unidades:", units);

    // Buscar "Litros" o "Lts" o "Kilogramos"
    const litrosUnit = units?.find(u => u.name.toLowerCase().includes('litro'));
    const kgUnit = units?.find(u => u.name.toLowerCase().includes('kilo'));
    const cajaUnit = units?.find(u => u.name.toLowerCase().includes('caja'));

    if (litrosUnit) {
        // Actualizar todos los rellenos y coberturas a Litros
        const { error } = await supabase.from('products').update({ unit_id: litrosUnit.id }).or('name.ilike.%relleno%,name.ilike.%cobertura%,name.ilike.%crocante%,name.ilike.%crocanta%');
        if (error) console.error("Error updating a Litros", error);
        else console.log("Complementos actualizados a Litros!");
    }

    if (cajaUnit) {
        // Si las paletas se cuentan por cajas, podemos cambiarlas. Pero usualmente las paletas individuales son Piezas.
        // Veremos si hay paletas. Dejaremos las paletas en Pieza por ahora.
    }
}

run();
