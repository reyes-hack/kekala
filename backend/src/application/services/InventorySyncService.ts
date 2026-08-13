import { supabase } from '../../infrastructure/database/supabaseClient';

export class InventorySyncService {
    
    /**
     * Procesa la sincronización de inventario a partir de un JSON de ventas extraído por Foodbot.
     * @param ventasData El objeto JSON completo generado por el scraper.
     */
    async syncSalesData(ventasData: any): Promise<{ success: boolean; message: string; results?: any }> {
        try {
            console.log(`[InventorySync] Iniciando sincronización para la fecha: ${ventasData.fecha}`);

            // 1. Obtener los mapeos de Foodbot (BOM/Recetario) desde Supabase
            const { data: mappings, error: mapError } = await supabase
                .from('foodbot_mappings')
                .select('foodbot_name, product_id, deduction_quantity')
                .eq('is_active', true);
            
            if (mapError) {
                throw new Error(`Error al cargar mapeos de Foodbot: ${mapError.message}`);
            }

            // Crear un diccionario rápido para buscar por nombre
            const recipeMap: Record<string, { product_id: string, deduction_quantity: number }> = {};
            mappings?.forEach(m => {
                recipeMap[m.foodbot_name.trim().toLowerCase()] = {
                    product_id: m.product_id,
                    deduction_quantity: parseFloat(m.deduction_quantity)
                };
            });

            // Arreglo para guardar todas las operaciones e insertarlas en lote
            const inventoryMovements: any[] = [];
            const syncResults: any[] = [];

            // 1.5 Obtener el ID del tipo de movimiento "SALE"
            const { data: saleTypeData, error: saleTypeError } = await supabase
                .from('catalog_values')
                .select('id')
                .eq('code', 'SALE')
                .single();
            
            if (saleTypeError || !saleTypeData) {
                throw new Error('No se pudo encontrar el tipo de movimiento SALE en el catálogo.');
            }
            const saleMovementTypeId = saleTypeData.id;

            // 2. Iterar sobre cada sucursal extraída
            for (const sucursal of ventasData.sucursales) {
                console.log(`\n  Procesando Sucursal: ${sucursal.branchName} (${sucursal.branchCode})`);
                
                // Necesitamos el UUID de la organizacion y la sucursal para poder insertar en movements
                const { data: branchData, error: branchError } = await supabase
                    .from('branches')
                    .select('id, organization_id')
                    .eq('code', sucursal.branchCode)
                    .single();
                
                if (branchError || !branchData) {
                    console.warn(`    ⚠️ Sucursal no encontrada en DB, saltando: ${sucursal.branchCode}`);
                    continue;
                }

                const missingRules = new Set<string>();
                let directProductsProcessed = 0;
                let recipeInputsProcessed = 0;
                const deductedItems: { name: string, quantity: number }[] = [];

                // --- 2.1 Procesar Productos Directos (Agua Natural, etc.) ---
                for (const prod of sucursal.productosVendidos) {
                    const { data: productInfo } = await supabase
                        .from('products')
                        .select('id')
                        .eq('product_code', prod.productCode)
                        .single();
                    
                    if (productInfo) {
                        inventoryMovements.push({
                            organization_id: branchData.organization_id,
                            branch_id: branchData.id,
                            product_id: productInfo.id,
                            movement_type_id: saleMovementTypeId,
                            quantity: -prod.cantidad,
                            notes: `Venta Foodbot: ${ventasData.fecha}`
                        });
                        directProductsProcessed++;
                        deductedItems.push({ name: prod.productName, quantity: prod.cantidad });
                    }
                }

                // --- 2.2 Procesar Modificadores (Bases, Coberturas, Rellenos) ---
                for (const mod of sucursal.modificadoresVendidos) {
                    const normalizedName = mod.modifierName.trim().toLowerCase();
                    const mapping = recipeMap[normalizedName];
                    
                    if (mapping) {
                        const deduction = mapping.deduction_quantity * mod.cantidad;
                        inventoryMovements.push({
                            organization_id: branchData.organization_id,
                            branch_id: branchData.id,
                            product_id: mapping.product_id,
                            movement_type_id: saleMovementTypeId,
                            quantity: -deduction,
                            notes: `Modificador Venta Foodbot: ${ventasData.fecha}`
                        });
                        recipeInputsProcessed += deduction;
                        deductedItems.push({ name: mod.modifierName, quantity: deduction });
                    } else {
                        missingRules.add(`Sin regla para: "${mod.modifierName}".`);
                    }
                }

                syncResults.push({
                    branchName: sucursal.branchName,
                    directProductsCount: directProductsProcessed,
                    recipeInputsCount: recipeInputsProcessed,
                    missingRules: Array.from(missingRules),
                    deductedItems: deductedItems
                });
            }

            // 3. Insertar Movimientos en Supabase
            if (inventoryMovements.length > 0) {
                const { error: insertError } = await supabase
                    .from('inventory_movements')
                    .insert(inventoryMovements);

                if (insertError) {
                    throw new Error(`Error al insertar movimientos: ${insertError.message}`);
                }
                
                // NOTA: La base de datos tiene un TRIGGER (trg_inventory_movements_after_insert)
                // que llama a sync_branch_inventory() automáticamente.
                // Ya NO hacemos updateBranchInventory manualmente aquí para evitar descontar DOBLE.

                console.log(`[InventorySync] Exito: ${inventoryMovements.length} movimientos de inventario registrados.`);
                return { success: true, message: `Sincronizados ${inventoryMovements.length} movimientos de inventario.`, results: syncResults };
            } else {
                return { success: true, message: "No hubo movimientos a sincronizar.", results: syncResults };
            }

        } catch (error: any) {
            console.error('[InventorySync] Error:', error);
            return { success: false, message: error.message };
        }
    }

    private async updateBranchInventory(movements: any[]) {
        // Agrupar movimientos por sucursal y producto
        const grouped: Record<string, number> = {};
        for(const m of movements) {
            const key = `${m.organization_id}|${m.branch_id}|${m.product_id}`;
            grouped[key] = (grouped[key] || 0) + m.quantity;
        }

        // Para cada grupo, buscar stock actual, sumar, y hacer upsert
        for(const [key, qtyToAdd] of Object.entries(grouped)) {
            const [org_id, branch_id, prod_id] = key.split('|');
            
            // Obtener actual
            const { data: current } = await supabase
                .from('branch_inventory')
                .select('current_stock, minimum_stock')
                .match({
                    organization_id: org_id,
                    branch_id: branch_id,
                    product_id: prod_id
                })
                .maybeSingle();
            
            const newStock = (current ? current.current_stock : 0) + qtyToAdd; // qtyToAdd es negativo
            
            // Upsert
            await supabase
                .from('branch_inventory')
                .upsert({
                    organization_id: org_id,
                    branch_id: branch_id,
                    product_id: prod_id,
                    current_stock: newStock,
                    minimum_stock: current ? current.minimum_stock : 10
                }, { onConflict: 'organization_id,branch_id,product_id' });
        }
    }
}
