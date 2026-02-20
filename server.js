import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// #13: Load .env config
dotenv.config();

// Routes
import uploadRoutes from './routes/upload.js';
import checkinRoutes from './routes/checkin.js';
import adminRoutes from './routes/admin.js';
import emailRoutes from './routes/email.js';
import teamsRoutes from './routes/teams.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/teams', teamsRoutes);

// #14: Serve frontend production build
const clientDist = join(__dirname, 'client', 'dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // SPA fallback
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(join(clientDist, 'index.html'));
        }
    });
}

// Ensure upload directory exists
const uploadDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// #11: Global error handler middleware
app.use((err, req, res, next) => {
    console.error('[Server Error]', req.method, req.url, err.message);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
