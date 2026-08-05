import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

async function run() {
    // Convert Supabase URL to connection string if needed, or use SUPABASE_DB_URL if it exists.
    // If not, we can construct it if we have the password. Let's see env vars.
    console.log("DB URL:", process.env.DATABASE_URL);
    
    if (!process.env.DATABASE_URL) {
        console.error("No DATABASE_URL found.");
        return;
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        await client.query(`
            ALTER TABLE public.products 
            ADD COLUMN IF NOT EXISTS cost_price DECIMAL(12, 2), 
            ADD COLUMN IF NOT EXISTS items_per_box INTEGER, 
            ADD COLUMN IF NOT EXISTS box_price DECIMAL(12, 2);
        `);
        console.log("Columnas agregadas con éxito a products.");
    } catch (e) {
        console.error("Error alterando tabla:", e);
    } finally {
        await client.end();
    }
}

run();
