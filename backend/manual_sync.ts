import { runFoodbotScraper } from './src/infrastructure/scraper/runScraper';
import { InventorySyncService } from './src/application/services/InventorySyncService';

async function run() {
  try {
    const data = await runFoodbotScraper('2026-08-19');
    if (data) {
        console.log("Scraper returned data. Running sync...");
        const syncService = new InventorySyncService();
        const result = await syncService.syncSalesData(data);
        console.log("Sync Result:", JSON.stringify(result, null, 2));
    } else {
        console.log("No data returned by scraper.");
    }
  } catch(e) {
    console.error("Error during manual sync:", e);
  }
}

run();
