import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import fs from 'fs';
import csv from 'csv-parser';
import db from '../db.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// POST /api/upload
router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
            // Strip BOM and trim whitespace from keys (Excel CSV issue)
            const cleaned = {};
            for (const [key, value] of Object.entries(data)) {
                const cleanKey = key.replace(/^\uFEFF/, '').trim();
                cleaned[cleanKey] = value ? value.trim() : value;
            }
            results.push(cleaned);
        })
        .on('end', async () => {
            // Clean up file
            fs.unlinkSync(req.file.path);

            const savedParticipants = [];
            const insert = db.prepare('INSERT INTO participants (name, email, checkin_code, qr_data) VALUES (?, ?, ?, ?)');

            const insertMany = db.transaction((participants) => {
                for (const p of participants) {
                    insert.run(p.name, p.email, p.checkin_code, p.qr_data);
                }
            });

            try {
                const participantsToInsert = [];
                for (const row of results) {
                    // Flexible column names: name/姓名, email/Email
                    const name = row.name || row['姓名'] || row['Name'];
                    const email = row.email || row['Email'] || row['信箱'];

                    if (name && email) {
                        const code = uuidv4().substring(0, 6).toUpperCase();
                        // Generate QR Code as Data URL
                        const qrData = await QRCode.toDataURL(code);

                        participantsToInsert.push({ name, email, checkin_code: code, qr_data: qrData });
                        savedParticipants.push({ name, email, checkin_code: code, qr_data: qrData });
                    }
                }

                insertMany(participantsToInsert);
                res.json({ success: true, count: savedParticipants.length, participants: savedParticipants });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Failed to process CSV or insert to database.' });
            }
        });
});

export default router;
