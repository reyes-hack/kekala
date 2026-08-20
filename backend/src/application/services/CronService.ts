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
        // Ejecutar cada hora, en el minuto 0 (Sync Foodbot)
        cron.schedule('0 * * * *', async () => {
            console.log('[Cron] Iniciando revisión automática de Foodbot Sync...');
            await this.runAutomatedSync();
        });

        // Ejecutar cada hora, en el minuto 15 (Marcar Ausentes)
        cron.schedule('15 * * * *', async () => {
            console.log('[Cron] Iniciando revisión de inasistencias...');
            await this.checkAbsences();
        });

        // Ejecutar diario a las 3:00 AM (Limpiar Fotos)
        cron.schedule('0 3 * * *', async () => {
            console.log('[Cron] Iniciando limpieza de fotos de asistencia...');
            await this.cleanAttendancePhotos();
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

            // 2. Get current time in local timezone (America/Mexico_City)
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Mexico_City',
                hour: 'numeric',
                hour12: false
            });
            const currentHour = parseInt(formatter.format(now));
            
            // 3. Get branches and their schedules
            const { data: branches, error } = await supabase
                .from('branches')
                .select('id, code, name, opening_time, closing_time, foodbot_sync_enabled')
                .eq('is_active', true);
            
            if (error || !branches) {
                console.error('[Cron] Error al cargar sucursales:', error);
                return;
            }

            const dateFormatter = new Intl.DateTimeFormat('en-CA', { // 'en-CA' outputs YYYY-MM-DD
                timeZone: 'America/Mexico_City'
            });
            const todayStr = dateFormatter.format(now);
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

    private async checkAbsences() {
        try {
            const now = new Date();
            
            // Usar timezone de Mexico para asistencia
            const timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Mexico_City', timeStyle: 'medium' });
            const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' });
            
            // Obtener el día de la semana (0 = Lunes, 6 = Domingo) en la zona local
            const localDateStr = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', weekday: 'short' }).format(now);
            const daysMap: Record<string, number> = { 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6 };
            const dayOfWeek = daysMap[localDateStr];

            const currentTime = timeFormatter.format(now); // "HH:MM:SS"
            const todayStr = dateFormatter.format(now); // "YYYY-MM-DD"

            const { data: pastAssignments, error } = await supabase
                .from('shift_assignments')
                .select(`
                    organization_id, profile_id, shift_id,
                    shifts!inner(branch_id, end_time)
                `)
                .eq('day_of_week', dayOfWeek)
                .eq('is_active', true)
                .lt('shifts.end_time', currentTime);

            if (error || !pastAssignments) {
                console.error('[Cron] Error fetch assignments:', error);
                return;
            }

            for (const assignment of pastAssignments) {
                const { data: existingLog } = await supabase
                    .from('attendance_logs')
                    .select('id')
                    .eq('profile_id', assignment.profile_id)
                    .eq('log_date', todayStr)
                    .single();

                if (!existingLog) {
                    await supabase.from('attendance_logs').insert({
                        organization_id: assignment.organization_id,
                        branch_id: assignment.shifts.branch_id,
                        profile_id: assignment.profile_id,
                        shift_id: assignment.shift_id,
                        log_date: todayStr,
                        status: 'ABSENT',
                        notes: 'Ausencia detectada por el sistema.'
                    });
                }
            }
        } catch (error) {
            console.error('[Cron] Error en checkAbsences:', error);
        }
    }

    private async cleanAttendancePhotos() {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const limitDateStr = yesterday.toISOString().split('T')[0];

            const { data: oldLogs, error } = await supabase
                .from('attendance_logs')
                .select('id, photo_url')
                .lt('log_date', new Date().toISOString().split('T')[0])
                .not('photo_url', 'is', null);

            if (error || !oldLogs) return;

            const filesToDelete = oldLogs.map(l => l.photo_url!.split('attendance-photos/')[1]).filter(Boolean);

            if (filesToDelete.length > 0) {
                await supabase.storage.from('attendance-photos').remove(filesToDelete);
                const logIds = oldLogs.map(l => l.id);
                await supabase.from('attendance_logs').update({ photo_url: null }).in('id', logIds);
                console.log(`[Cron] Se limpiaron ${filesToDelete.length} fotos de asistencia.`);
            }
        } catch (error) {
            console.error('[Cron] Error en cleanAttendancePhotos:', error);
        }
    }
}
