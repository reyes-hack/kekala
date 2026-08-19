import { supabase } from '../../infrastructure/database/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

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

            const recipeMap: Record<string, { product_id: string, deduction_quantity: number }> = {};
            mappings?.forEach((m: any) => {
                recipeMap[m.foodbot_name.trim().toLowerCase()] = {
                    product_id: m.product_id,
                    deduction_quantity: parseFloat(m.deduction_quantity)
                };
            });

            // IDs de Catálogos
            const { data: saleTypeData } = await supabase.from('catalog_values').select('id').eq('code', 'SALE').single();
            const saleMovementTypeId = saleTypeData?.id;

            // Obtener el SALE_STATUS = COMPLETED/APPROVED
            const { data: saleStatusType } = await supabase.from('catalog_types').select('id').eq('code', 'SALE_STATUS').single();
            const { data: completedStatusData } = await supabase.from('catalog_values').select('id').eq('catalog_type_id', saleStatusType?.id).in('code', ['APPROVED', 'COMPLETED']).limit(1).single();
            const saleStatusId = completedStatusData?.id;

            // Obtener PAYMENT_METHOD ids
            const { data: pmType } = await supabase.from('catalog_types').select('id').eq('code', 'PAYMENT_METHOD').single();
            const { data: pmData } = await supabase.from('catalog_values').select('id, code').eq('catalog_type_id', pmType?.id);
            
            // Obtener un usuario bot para "created_by"
            const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
            const createdBy = profile?.id;

            if (!saleMovementTypeId || !saleStatusId || !createdBy) {
                console.warn('Faltan IDs críticos en el catálogo (SALE, SALE_STATUS, PROFILE). Esto podría causar errores.');
            }

            // Arreglos para guardado por lotes
            const inventoryMovements: any[] = [];
            const salesInserts: any[] = [];
            const paymentsInserts: any[] = [];
            const externalReportsInserts: any[] = [];
            const externalItemsInserts: any[] = [];
            
            const syncResults: any[] = [];

            // 2. Iterar sobre cada sucursal extraída
            for (const sucursal of ventasData.sucursales) {
                console.log(`\n  Procesando Sucursal: ${sucursal.branchName} (${sucursal.branchCode})`);
                
                const { data: branchData, error: branchError } = await supabase
                    .from('branches')
                    .select('id, organization_id')
                    .eq('code', sucursal.branchCode)
                    .single();
                
                if (branchError || !branchData) {
                    console.warn(`    ⚠️ Sucursal no encontrada en DB, saltando: ${sucursal.branchCode}`);
                    continue;
                }

                // ==========================================
                // 2.0.5 FETCH PREVIOUS SYNC STATE FOR DELTA CALCULATION
                // ==========================================
                const previousQuantities = new Map<string, number>();
                const { data: prevReports } = await supabase
                    .from('external_sales_reports')
                    .select('id')
                    .eq('report_date', ventasData.fecha)
                    .eq('branch_id', branchData.id)
                    .eq('source', 'FOODBOT');
                
                if (prevReports && prevReports.length > 0) {
                    const prevReportIds = prevReports.map(r => r.id);
                    const { data: prevItems } = await supabase
                        .from('external_sales_report_items')
                        .select('source_product_code, quantity_sold')
                        .in('report_id', prevReportIds);
                    
                    if (prevItems) {
                        prevItems.forEach(item => {
                            previousQuantities.set(item.source_product_code, item.quantity_sold);
                        });
                    }
                }

                // ==========================================
                // 2.1 CONSTRUIR EL REPORTE EXTERNO (Para gráficas)
                // ==========================================
                const reportId = uuidv4();
                externalReportsInserts.push({
                    id: reportId,
                    organization_id: branchData.organization_id,
                    branch_id: branchData.id,
                    source: 'FOODBOT',
                    report_date: ventasData.fecha,
                    total_orders: sucursal.kpis?.ordenes || 0,
                    total_sales: sucursal.kpis?.ventas || 0,
                    average_ticket: sucursal.kpis?.ticketPromedio || 0,
                    raw_data: sucursal
                });

                // ==========================================
                // 2.2 CONSTRUIR LA VENTA FINANCIERA (Para P&L)
                // ==========================================
                const saleId = uuidv4();
                const totalVentas = parseFloat(sucursal.kpis?.ventas || 0);
                const saleNumber = `FB-${ventasData.fecha}-${sucursal.branchCode}`;
                
                if (totalVentas > 0) {
                    salesInserts.push({
                        id: saleId,
                        organization_id: branchData.organization_id,
                        branch_id: branchData.id,
                        sale_number: saleNumber,
                        created_by: createdBy,
                        status_id: saleStatusId,
                        subtotal: totalVentas,
                        total_amount: totalVentas,
                        notes: `Venta sincronizada por Foodbot - ${ventasData.fecha}`,
                        created_at: `${ventasData.fecha}T23:59:59Z` // Asignar la fecha extraída
                    });

                    // Construir los pagos
                    if (sucursal.metodosDePago) {
                        for (const pm of sucursal.metodosDePago) {
                            let methodCode = 'OTRO';
                            const pmStr = pm.paymentMethod.toLowerCase();
                            if (pmStr.includes('cash') || pmStr.includes('efectivo')) methodCode = 'CASH';
                            else if (pmStr.includes('tarjeta') || pmStr.includes('terminal')) methodCode = 'CARD';
                            else if (pmStr.includes('transfer') || pmStr.includes('spei')) methodCode = 'TRANSFER';
                            else if (pmStr.includes('didi') || pmStr.includes('rappi') || pmStr.includes('uber')) methodCode = 'DIGITAL_WALLET';

                            const pmDb = pmData?.find((p: any) => p.code === methodCode) || pmData?.find((p: any) => p.code === 'OTRO');
                            
                            paymentsInserts.push({
                                organization_id: branchData.organization_id,
                                branch_id: branchData.id,
                                sale_id: saleId,
                                payment_method_id: pmDb?.id,
                                amount: pm.ventas,
                                reference_number: `FB-${methodCode}-${ventasData.fecha}`,
                                created_at: `${ventasData.fecha}T23:59:59Z`
                            });
                        }
                    } else {
                        // Si no hay metodos, asume todo en CASH
                        const pmDb = pmData?.find((p: any) => p.code === 'CASH');
                        paymentsInserts.push({
                            organization_id: branchData.organization_id,
                            branch_id: branchData.id,
                            sale_id: saleId,
                            payment_method_id: pmDb?.id,
                            amount: totalVentas,
                            created_at: `${ventasData.fecha}T23:59:59Z`
                        });
                    }
                }

                // ==========================================
                // 2.3 PROCESAR PRODUCTOS Y MODIFICADORES (Inventario y Items)
                // ==========================================
                const missingRules = new Set<string>();
                let directProductsProcessed = 0;
                let recipeInputsProcessed = 0;
                const deductedItems: { name: string, quantity: number }[] = [];

                const itemsMap = new Map();

                for (const prod of (sucursal.productosVendidos || [])) {
                    // Para gráficas
                    const prodCode = prod.productCode || 'N/A';
                    const key = `${reportId}_${prodCode}`;
                    if (itemsMap.has(key)) {
                        const ex = itemsMap.get(key);
                        ex.orders_count += (prod.ordenes || 0);
                        ex.quantity_sold += (prod.cantidad || 0);
                        ex.total_sales += (prod.ventas || 0);
                    } else {
                        itemsMap.set(key, {
                            organization_id: branchData.organization_id,
                            report_id: reportId,
                            source_product_code: prodCode,
                            source_product_name: prod.productName,
                            orders_count: prod.ordenes || 0,
                            quantity_sold: prod.cantidad || 0,
                            total_sales: prod.ventas || 0,
                            raw_data: { type: 'product' }
                        });
                    }

                    // Para inventario
                    const { data: productInfo } = await supabase
                        .from('products')
                        .select('id')
                        .eq('product_code', prod.productCode)
                        .single();
                    
                    if (productInfo && saleMovementTypeId) {
                        const previousQty = previousQuantities.get(prodCode) || 0;
                        const delta = prod.cantidad - previousQty;

                        if (delta !== 0) {
                            inventoryMovements.push({
                                organization_id: branchData.organization_id,
                                branch_id: branchData.id,
                                product_id: productInfo.id,
                                movement_type_id: saleMovementTypeId,
                                quantity: -delta,
                                notes: `Venta Foodbot Delta: ${ventasData.fecha}`
                            });
                            directProductsProcessed++;
                            deductedItems.push({ name: prod.productName, quantity: delta });
                        }
                    }
                }

                for (const mod of (sucursal.modificadoresVendidos || [])) {
                    // Para gráficas
                    const modCode = 'MOD_' + mod.modifierName.toUpperCase().replace(/[^A-Z0-9_]/g, '_').substring(0, 40);
                    const key = `${reportId}_${modCode}`;
                    if (itemsMap.has(key)) {
                        const ex = itemsMap.get(key);
                        ex.orders_count += (mod.ordenes || 0);
                        ex.quantity_sold += (mod.cantidad || 0);
                        ex.total_sales += (mod.ventas || 0);
                    } else {
                        itemsMap.set(key, {
                            organization_id: branchData.organization_id,
                            report_id: reportId,
                            source_product_code: modCode,
                            source_product_name: mod.modifierName,
                            orders_count: mod.ordenes || 0,
                            quantity_sold: mod.cantidad || 0,
                            total_sales: mod.ventas || 0,
                            raw_data: { type: 'modifier' }
                        });
                    }

                    // Para inventario
                    const normalizedName = mod.modifierName.trim().toLowerCase();
                    const mapping = recipeMap[normalizedName];
                    
                    if (mapping && saleMovementTypeId) {
                        const previousQty = previousQuantities.get(modCode) || 0;
                        const delta = mod.cantidad - previousQty;

                        if (delta !== 0) {
                            const deduction = mapping.deduction_quantity * delta;
                            inventoryMovements.push({
                                organization_id: branchData.organization_id,
                                branch_id: branchData.id,
                                product_id: mapping.product_id,
                                movement_type_id: saleMovementTypeId,
                                quantity: -deduction,
                                notes: `Modificador Venta Foodbot Delta: ${ventasData.fecha}`
                            });
                            recipeInputsProcessed += Math.abs(deduction);
                            deductedItems.push({ name: mod.modifierName, quantity: delta });
                        }
                    } else {
                        missingRules.add(`Sin regla para: "${mod.modifierName}".`);
                    }
                }
                
                // Agregar los items agregados de este reporte a la lista global
                for (const item of itemsMap.values()) {
                    externalItemsInserts.push(item);
                }

                syncResults.push({
                    branchName: sucursal.branchName,
                    directProductsCount: directProductsProcessed,
                    recipeInputsCount: recipeInputsProcessed,
                    missingRules: Array.from(missingRules),
                    deductedItems: deductedItems
                });
            }

            // 3. Inserciones en Batch
            
            // 3.1 External Reports (UPSERT por si se corre 2 veces el mismo dia)
            if (externalReportsInserts.length > 0) {
                // Borramos los del mismo dia primero para ser idempotentes
                const branchesIds = externalReportsInserts.map(r => r.branch_id);
                await supabase.from('external_sales_reports').delete().eq('report_date', ventasData.fecha).in('branch_id', branchesIds);
                
                const { error: rErr } = await supabase.from('external_sales_reports').insert(externalReportsInserts);
                if (rErr) console.error('Error insertando reports:', rErr);
                
                const { error: iErr } = await supabase.from('external_sales_report_items').insert(externalItemsInserts);
                if (iErr) console.error('Error insertando items:', iErr);
            }

            // 3.2 Ventas Reales (Financial)
            if (salesInserts.length > 0) {
                // Borramos las ventas de foodbot generadas este dia para no duplicar (Pagos primero)
                const saleNumbers = salesInserts.map(s => s.sale_number);
                
                // Obtener los IDs de las ventas a eliminar
                const { data: salesToDelete } = await supabase.from('sales').select('id').in('sale_number', saleNumbers);
                if (salesToDelete && salesToDelete.length > 0) {
                    const idsToDelete = salesToDelete.map(s => s.id);
                    await supabase.from('payments').delete().in('sale_id', idsToDelete);
                    await supabase.from('sales').delete().in('id', idsToDelete);
                }
                
                await supabase.from('sales').insert(salesInserts);
                await supabase.from('payments').insert(paymentsInserts);
            }

            // 3.3 Movimientos de Inventario
            if (inventoryMovements.length > 0) {
                const { error: insertError } = await supabase
                    .from('inventory_movements')
                    .insert(inventoryMovements);

                if (insertError) {
                    throw new Error(`Error al insertar movimientos: ${insertError.message}`);
                }
            }

            console.log(`[InventorySync] Exito: ${inventoryMovements.length} movimientos de inventario, ${salesInserts.length} ventas y ${externalReportsInserts.length} reportes registrados.`);
            return { success: true, message: `Sincronizados ${inventoryMovements.length} movimientos y reportes financieros.`, results: syncResults };

        } catch (error: any) {
            console.error('[InventorySync] Error:', error);
            return { success: false, message: error.message };
        }
    }
}
