import { Request, Response } from 'express';
import { InventorySyncService } from '../../application/services/InventorySyncService';
import fs from 'fs';
import path from 'path';

import { runFoodbotScraper } from '../../infrastructure/scraper/runScraper';

export class SyncController {
    
    private syncService = new InventorySyncService();

    /**
     * Endpoint para sincronizar las ventas manualmente
     */
    public syncFromScraperOutput = async (req: Request, res: Response) => {
        try {
            const { fecha } = req.body;
            if (!fecha) {
                return res.status(400).json({ success: false, message: 'La fecha es requerida' });
            }

            console.log(`[SyncController] Ejecutando scraper para la fecha: ${fecha}...`);
            
            try {
                // Ejecutar el scraper de Foodbot usando la función exportada
                const ventasData = await runFoodbotScraper(fecha);

                // Validar que el archivo corresponde a la fecha que pedimos
                if (ventasData.fecha !== fecha) {
                    return res.status(400).json({ success: false, message: `El scraper devolvió datos de ${ventasData.fecha} pero se pidió ${fecha}.` });
                }

                const result = await this.syncService.syncSalesData(ventasData);

                if (result.success) {
                    return res.status(200).json(result);
                } else {
                    return res.status(500).json(result);
                }
            } catch (e: any) {
                return res.status(500).json({ success: false, message: `Error al extraer datos de Foodbot: ${e.message || 'Timeout'}` });
            }

        } catch (error: any) {
            console.error('[SyncController]', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    };
}
