import express from 'express';
import cors from 'cors';
import { SyncController } from './presentation/controllers/SyncController';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const syncController = new SyncController();
app.post('/api/ventas/sync', syncController.syncFromScraperOutput);

// Startup
app.listen(port, () => {
    console.log(`🚀 Kekala Backend Server corriendo en http://localhost:${port}`);
});
