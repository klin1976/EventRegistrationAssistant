import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Routes
import uploadRoutes from './routes/upload.js';
import checkinRoutes from './routes/checkin.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors()); // Allow frontend dev server requests
app.use(express.json());

// API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/admin', adminRoutes);

// Statics (if needed later for production build)
// app.use(express.static(join(__dirname, 'client/dist')));

// Ensure upload directory exists
const uploadDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
