import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function run() {
    console.log("Cambiando unidades a Mililitro...");
    
    // 1. Obtener la unidad Mililitro
    const { data: units } = await supabase.from('catalog_values').select('*').eq('catalog_type_id', '3a3f0c50-fa65-4219-b1b4-065703e92ca0');
    const mlUnit = units?.find(u => u.name.toLowerCase().includes('mililitro') || u.code === 'MILLILITER');
    const unitUnit = units?.find(u => u.code === 'UNIT');

    if (mlUnit) {
        // Actualizar complementos a Mililitro
        await supabase.from('products').update({ unit_id: mlUnit.id }).or('name.ilike.%relleno%,name.ilike.%cobertura%,name.ilike.%crocante%,name.ilike.%crocanta%');
    }

    // 2. Obtener todos los productos
    const { data: products } = await supabase.from('products').select('id, name, product_code');
    if (!products) return;

    console.log("Generando mapeos de Foodbot...");

    const mappings = [];

    const normalizeForFoodbot = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Quita acentos
    };

    for (const prod of products) {
        const lowerName = prod.name.toLowerCase();
        let deduction = 1; // Default para piezas
        const aliases = []; // Podemos tener multiples nombres de foodbot para el mismo producto

        if (lowerName.includes('cobertura') || lowerName.includes('relleno') || lowerName.includes('crocante') || lowerName.includes('crocanta')) {
            deduction = 50;
        }

        const normalizedName = normalizeForFoodbot(prod.name);
        const lowerNormalized = normalizedName.toLowerCase();
        
        // Mapeo base "inteligente" original
        if (lowerName.includes('original')) {
            const parts = prod.name.split(' ');
            const f = parts.filter(p => p.toLowerCase() !== 'original').join(' ');
            aliases.push(`Base Original ${normalizeForFoodbot(f)}`);
            if (lowerNormalized.includes('fresa')) aliases.push('Fresa', 'Base Original Fresa');
            if (lowerNormalized.includes('mora')) aliases.push('Mora', 'Base Original Mora');
            if (lowerNormalized.includes('yogurt')) aliases.push('Base Original Yogurth Griego', 'Yogurth Griego');
        } else if (lowerName.includes('flat')) {
            const parts = prod.name.split(' ');
            const f = parts.filter(p => p.toLowerCase() !== 'flat').join(' ');
            aliases.push(`Base Flat ${normalizeForFoodbot(f)}`);
            if (lowerNormalized.includes('yogurt')) aliases.push('Base Flat Yogurth Griego');
            if (lowerNormalized.includes('maracuya')) aliases.push('Base Flat Maracuya');
        } else {
            aliases.push(normalizedName);
        }

        // Sobrescribir y/o agregar casos especiales para las coberturas y rellenos
        if (lowerName === 'cobertura blanca') aliases.push('Cobertura Chocolate Blanco');
        if (lowerName === 'cobertura semi amarga') aliases.push('Cobertura Chocolate Semi Amargo');
        if (lowerName === 'cobertura con leche') aliases.push('Cobertura Chocolate con Leche');
        if (lowerName === 'cobertura blanca con almendras') aliases.push('Cobertura Chocolate Blanco con Almendras');
        
        if (lowerName === 'crocanta de avellanas') aliases.push('Cobertura Crocante de Avellanas');
        if (lowerName === 'crocante de pistache') aliases.push('Cobertura Crocante de Pistache');

        if (lowerName === 'relleno blanco') aliases.push('Relleno Chocolate Blanco');
        if (lowerName === 'relleno con leche') aliases.push('Relleno Chocolate con Leche');
        if (lowerName === 'relleno semi amargo') aliases.push('Relleno Chocolate Semi Amargo');
        if (lowerName === 'relleno kinder bueno') aliases.push('Relleno Buono');
        if (lowerName === 'relleno lechisimo') aliases.push('Relleno Lechisimo');

        // Generar los registros
        for (const alias of aliases) {
            mappings.push({
                foodbot_name: alias,
                product_id: prod.id,
                deduction_quantity: deduction,
                is_active: true
            });
        }
    }

    // Insertar mapeos, ignorando si ya existen
    for (const m of mappings) {
        const { error } = await supabase.from('foodbot_mappings')
            .upsert(m, { onConflict: 'foodbot_name', ignoreDuplicates: true });
        if (error) {
            console.error(`Error insertando ${m.foodbot_name}:`, error.message);
        }
    }

    console.log("¡Mapeos generados y unidades actualizadas a Mililitros!");
}

run();
