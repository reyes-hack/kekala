import cron from 'node-cron';
import { supabase } from '../../infrastructure/database/supabaseClient';
import { InventorySyncService } from './InventorySyncService';
import { runFoodbotScraper } from '../../infrastructure/scraper/runScraper';

export class CronService {
    private syncService: InventorySyncService;

    constructor() {
        this.syncService = new InventorySyncService();
    }

    public start() {
        // Ejecutar cada hora, en el minuto 0
        cron.schedule('0 * * * *', async () => {
            console.log('[Cron] Iniciando revisión automática de Foodbot Sync...');
            await this.runAutomatedSync();
        });
        console.log('[Cron] Servicio de tareas programadas iniciado.');
    }

    private async runAutomatedSync() {
        try {
            // 1. Check global toggle
            const { data: globalSetting } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'FOODBOT_SYNC_GLOBAL_ENABLED')
                .single();

            if (globalSetting && globalSetting.value === false) {
                console.log('[Cron] Sincronización automática desactivada a nivel global.');
                return;
            }

            // 2. Get current time in local timezone (assuming Mexico City for this system)
            const now = new Date();
            const currentHour = now.getHours();
            
            // 3. Get branches and their schedules
            const { data: branches, error } = await supabase
                .from('branches')
                .select('id, code, name, opening_time, closing_time, foodbot_sync_enabled')
                .eq('is_active', true);
            
            if (error || !branches) {
                console.error('[Cron] Error al cargar sucursales:', error);
                return;
            }

            const todayStr = now.toISOString().split('T')[0];
            let shouldRunScraper = false;

            // We determine if we need to run the scraper by checking if AT LEAST ONE branch needs syncing right now.
            // Requirement: "cada 4 horas despues de abrir y una vez cerrada se detiene"
            // Example: Opens at 10:00. Syncs at 14:00, 18:00, 22:00.
            
            for (const branch of branches) {
                if (!branch.foodbot_sync_enabled) continue;
                if (!branch.opening_time || !branch.closing_time) continue;

                const openHour = parseInt(branch.opening_time.split(':')[0]);
                const closeHour = parseInt(branch.closing_time.split(':')[0]);

                // Is the branch currently open?
                if (currentHour >= openHour && currentHour <= closeHour) {
                    // Is it a 4-hour interval since opening?
                    // (currentHour - openHour) % 4 === 0 && currentHour !== openHour
                    if ((currentHour - openHour) % 4 === 0 && currentHour > openHour) {
                        shouldRunScraper = true;
                        break;
                    }
                }
            }

            if (!shouldRunScraper) {
                console.log(`[Cron] Ninguna sucursal requiere sincronización en la hora actual (${currentHour}:00).`);
                return;
            }

            console.log(`[Cron] Ejecutando Scraper automatizado para la fecha ${todayStr}...`);
            
            // Execute scraper
            const ventasData = await runFoodbotScraper(todayStr);
            
            // Execute sync logic
            const result = await this.syncService.syncSalesData(ventasData);

            // Log history
            await supabase.from('sync_history').insert({
                sync_date: todayStr,
                status: result.success ? 'SUCCESS' : 'ERROR',
                message: result.message,
                results: result.results || {}
            });

            console.log('[Cron] Sincronización automática finalizada.');

        } catch (error: any) {
            console.error('[Cron] Error en el flujo automático:', error);
            await supabase.from('sync_history').insert({
                sync_date: new Date().toISOString().split('T')[0],
                status: 'ERROR',
                message: error.message
            });
        }
    }
}
