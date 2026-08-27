import { runFoodbotScraper } from './src/infrastructure/scraper/runScraper';

import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    const dates = [
        '2026-08-19',
        '2026-08-20',
        '2026-08-21',
        '2026-08-22',
        '2026-08-23',
        '2026-08-24',
        '2026-08-25',
        '2026-08-26'
    ];

    const allResults = [];

    for (const date of dates) {
        console.log(`\n\n========================`);
        console.log(`Starting sync for ${date}`);
        console.log(`========================\n`);

        try {
            const ventasData = await runFoodbotScraper(date);
            allResults.push(ventasData);
        } catch (e) {
            console.error(`Error processing date ${date}:`, e);
        }
    }

    fs.writeFileSync('foodbot_sync_19_to_26.json', JSON.stringify(allResults, null, 2));
    console.log(`\nDone! Saved all raw JSON to foodbot_sync_19_to_26.json`);
}

run().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
