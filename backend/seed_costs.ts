import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

// Costos basados en el Excel proporcionado por el usuario
const COST_MAPPINGS = {
    // BASES ORIGINALES
    'Yogurt': { cost_price: 22.50, box_price: 540.00, items_per_box: 24, matchPattern: 'Yogurt Original' },
    'Fresa': { cost_price: 22.50, box_price: 540.00, items_per_box: 24, matchPattern: 'Fresa Original' },
    'Mora': { cost_price: 22.50, box_price: 540.00, items_per_box: 24, matchPattern: 'Mora Original' },
    'Lechisimo': { cost_price: 22.50, box_price: 540.00, items_per_box: 24, matchPattern: 'Lechísimo Original' },
    'Chocolate': { cost_price: 22.50, box_price: 540.00, items_per_box: 24, matchPattern: 'Chocolate Original' },
    'Coco': { cost_price: 22.50, box_price: 540.00, items_per_box: 24, matchPattern: 'Coco Original' },

    // BASES FLAT
    'Lechisimo Flat': { cost_price: 22.50, box_price: 630.00, items_per_box: 28, matchPattern: 'Lechísimo Flat' },
    'Yogurt Flat': { cost_price: 22.50, box_price: 630.00, items_per_box: 28, matchPattern: 'Yogurt Flat' },
    'Chocolate Flat': { cost_price: 22.50, box_price: 630.00, items_per_box: 28, matchPattern: 'Chocolate Flat' },
    'Maracuya Zero Flat': { cost_price: 22.50, box_price: 630.00, items_per_box: 28, matchPattern: 'Maracuyá Zero Flat' },

    // COBERTURAS (Manejaremos Unitario, las Cajas variarán según compras, dejaremos items_per_box null)
    'Blanco': { cost_price: 200.00, box_price: 200.00, items_per_box: 1, matchPattern: 'Cobertura Blanca' },
    'Blanco Con Almendras': { cost_price: 215.00, box_price: 215.00, items_per_box: 1, matchPattern: 'Cobertura Blanca con Almendras' },
    'Con Leche': { cost_price: 250.00, box_price: 250.00, items_per_box: 1, matchPattern: 'Cobertura Con Leche' },
    'Semi Amargo': { cost_price: 250.00, box_price: 250.00, items_per_box: 1, matchPattern: 'Cobertura Semi Amarga' },
    'Crocanta De Avellanas': { cost_price: 265.00, box_price: 265.00, items_per_box: 1, matchPattern: 'Crocanta de Avellanas' },
    'Crocante De Pistache': { cost_price: 490.00, box_price: 490.00, items_per_box: 1, matchPattern: 'Crocante de Pistache' },

    // RELLENOS
    'Lechera': { cost_price: 50.00, box_price: 50.00, items_per_box: 1, matchPattern: 'Relleno Lechera' },
    'Nutella': { cost_price: 156.48, box_price: 156.48, items_per_box: 1, matchPattern: 'Relleno Nutella' },
    'Blanco (Relleno)': { cost_price: 125.00, box_price: 125.00, items_per_box: 1, matchPattern: 'Relleno Blanco' },
    'Con Leche (Relleno)': { cost_price: 140.00, box_price: 140.00, items_per_box: 1, matchPattern: 'Relleno Con Leche' },
    'Semi Amargo (Relleno)': { cost_price: 140.00, box_price: 140.00, items_per_box: 1, matchPattern: 'Relleno Semi Amargo' },
    'Lechisimo (Relleno)': { cost_price: 260.00, box_price: 260.00, items_per_box: 1, matchPattern: 'Relleno Lechísimo' },
    'Kinder Bueno': { cost_price: 250.00, box_price: 250.00, items_per_box: 1, matchPattern: 'Relleno Kinder Bueno' },
    'Psitache': { cost_price: 320.00, box_price: 320.00, items_per_box: 1, matchPattern: 'Relleno Pistache' }
};

async function seedCosts() {
    console.log('Obteniendo productos...');
    const { data: products, error } = await supabase.from('products').select('id, name');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    let updatedCount = 0;

    for (const prod of products) {
        // Encontrar el mapeo
        const mappingKey = Object.keys(COST_MAPPINGS).find(k => 
            prod.name.toLowerCase().includes(COST_MAPPINGS[k].matchPattern.toLowerCase())
        );

        if (mappingKey) {
            const costData = COST_MAPPINGS[mappingKey];
            const { error: updErr } = await supabase
                .from('products')
                .update({ 
                    cost_price: costData.cost_price, 
                    box_price: costData.box_price, 
                    items_per_box: costData.items_per_box 
                })
                .eq('id', prod.id);

            if (updErr) {
                console.error(`Error actualizando ${prod.name}:`, updErr.message);
            } else {
                console.log(`✅ Actualizado: ${prod.name} -> Costo: $${costData.cost_price}`);
                updatedCount++;
            }
        }
    }

    console.log(`\n¡Costos insertados exitosamente! (${updatedCount} productos actualizados)`);
}

seedCosts();
