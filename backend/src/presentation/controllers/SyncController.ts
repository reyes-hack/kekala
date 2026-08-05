import { Request, Response } from 'express';
import { InventorySyncService } from '../../application/services/InventorySyncService';
import fs from 'fs';
import path from 'path';

export class SyncController {
    
    private syncService = new InventorySyncService();

    /**
     * Endpoint para sincronizar las ventas simuladas (leer el JSON local)
     */
    public syncFromScraperOutput = async (req: Request, res: Response) => {
        try {
            const { fecha } = req.body;
            if (!fecha) {
                return res.status(400).json({ success: false, message: 'La fecha es requerida' });
            }

            // Convertir YYYY-MM-DD a DD-MM-YYYY
            const [year, month, day] = fecha.split('-');
            const scraperDate = `${day}-${month}-${year}`;

            console.log(`[SyncController] Ejecutando scraper para la fecha: ${scraperDate}...`);
            
            // Ejecutar el scraper
            const { execSync, exec } = require('child_process');
            try {
                // En el futuro, podríamos recibir el payload del body o ejecutar
                // el scraper On-Demand. Por ahora, asumimos que el script runScraper
                // ya dejó el archivo json listo.
                const outputPath = path.resolve(__dirname, '../../infrastructure/scraper/ventas-output.json');
                
                // --- COMENTADO PARA NO EJECUTAR EL SCRAPER Y USAR EL JSON LOCAL ---
                /*
                const scraperScriptPath = path.resolve(__dirname, '../../infrastructure/scraper/runScraper.ts');
                
                await new Promise((resolve, reject) => {
                    exec(`npx tsx "${scraperScriptPath}" "${fecha}"`, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Scraper error: ${error.message}`);
                            return reject(error);
                        }
                        if (stderr) {
                            console.error(`Scraper stderr: ${stderr}`);
                        }
                        console.log(`Scraper stdout: ${stdout}`);
                        resolve(true);
                    });
                });
                */
                // ------------------------------------------------------------------

                // Verificar que el archivo se haya generado
                if (!fs.existsSync(outputPath)) {
                    throw new Error('El archivo de ventas no se generó correctamente.');
                }

                const rawData = fs.readFileSync(outputPath, 'utf-8');
                const ventasData = JSON.parse(rawData);

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
            } catch (e) {
                return res.status(500).json({ success: false, message: 'Error al extraer datos de Foodbot (Timeout o error en Scraper).' });
            }

        } catch (error: any) {
            console.error('[SyncController]', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    };
}
