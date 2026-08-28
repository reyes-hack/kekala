import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { InventorySyncService } from './src/application/services/InventorySyncService';

dotenv.config();

async function runSandboxSync() {
    console.log("Cargando datos de foodbot_sync_19_to_26.json...");
    const rawData = fs.readFileSync('foodbot_sync_19_to_26.json', 'utf8');
    const allDaysData = JSON.parse(rawData);

    const syncService = new InventorySyncService();

    for (let dayData of allDaysData) {
        // Encontrar los datos de ELDORADO_VER
        const elDoradoData = dayData.sucursales.find((s: any) => s.branchCode === 'ELDORADO_VER');
        
        if (elDoradoData) {
            console.log(`\n===========================================`);
            console.log(`Sincronizando fecha: ${dayData.fecha} hacia SANDBOX...`);
            
            // Reemplazar el código por el de SANDBOX para engañar al servicio de sincronización
            const sandboxData = JSON.parse(JSON.stringify(elDoradoData));
            sandboxData.branchCode = 'SANDBOX-MOD-1';
            sandboxData.branchName = 'Sandbox';

            // Modificar el JSON que se le pasará al servicio para que SOLO contenga Sandbox
            dayData.sucursales = [sandboxData];

            try {
                const result = await syncService.syncSalesData(dayData);
                console.log(`Resultado ${dayData.fecha}:`, result.message);
            } catch (err) {
                console.error(`Error sincronizando ${dayData.fecha}:`, err);
            }
        } else {
            console.warn(`No se encontró ELDORADO_VER para la fecha ${dayData.fecha}`);
        }
    }
    
    console.log("\nSincronización hacia Sandbox terminada.");
}

runSandboxSync().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
