import { supabase } from './src/infrastructure/database/supabaseClient';

async function corregirHistoricos() {
    console.log("Iniciando corrección de sucursales en Cortes de Caja (Históricos)...");

    try {
        // 1. Obtener todos los cortes de caja
        const { data: closures, error: closuresError } = await supabase
            .from('cash_closures')
            .select('id, branch_id, opened_by');

        if (closuresError) throw closuresError;
        if (!closures || closures.length === 0) {
            console.log("No hay cortes de caja registrados.");
            return;
        }

        // 2. Obtener perfiles para conocer la sucursal real de cada empleado
        const userIds = [...new Set(closures.map(c => c.opened_by).filter(Boolean))];
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, branch_id')
            .in('id', userIds);

        if (profilesError) throw profilesError;

        const profileMap = {};
        profiles.forEach(p => {
            profileMap[p.id] = p.branch_id;
        });

        // 3. Revisar cuáles están equivocados
        const updates = [];
        for (const closure of closures) {
            const realBranch = profileMap[closure.opened_by];
            // Si el empleado tiene una sucursal asignada y no coincide con la del corte
            if (realBranch && closure.branch_id !== realBranch) {
                updates.push({
                    closure_id: closure.id,
                    old_branch: closure.branch_id,
                    new_branch: realBranch
                });
            }
        }

        console.log(`Se encontraron ${updates.length} cortes registrados en sucursales equivocadas.`);

        // 4. Aplicar correcciones
        let successCount = 0;
        for (const update of updates) {
            const { error: updateError } = await supabase
                .from('cash_closures')
                .update({ branch_id: update.new_branch })
                .eq('id', update.closure_id);
            
            if (updateError) {
                console.error(`Error actualizando corte ${update.closure_id}:`, updateError.message);
            } else {
                successCount++;
            }
        }

        console.log(`Corrección finalizada. Cortes corregidos: ${successCount}/${updates.length}`);

    } catch (err) {
        console.error("Error fatal:", err);
    }
}

corregirHistoricos();
