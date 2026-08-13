import express, { Request, Response } from 'express';
import cors from 'cors';
import { SyncController } from './presentation/controllers/SyncController';
import { CronService } from './application/services/CronService';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const syncController = new SyncController();
const cronService = new CronService();

app.post('/api/ventas/sync', syncController.syncFromScraperOutput);

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

// Startup
app.listen(port, () => {
    console.log(`[Server] KEKALA Backend running on port ${port}`);
    cronService.start();
});
