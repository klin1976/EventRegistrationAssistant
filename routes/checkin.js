import express from 'express';
import db from '../db.js';

const router = express.Router();

// POST /api/checkin
router.post('/', (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Code is required' });
        }

        const cleanCode = code.trim().toUpperCase();
        console.log('[Checkin] Looking up code:', cleanCode);

        const stmt = db.prepare('SELECT * FROM participants WHERE checkin_code = ?');
        const participant = stmt.get(cleanCode);

        if (!participant) {
            console.log('[Checkin] Code not found:', cleanCode);
            return res.status(404).json({ success: false, message: 'Invalid Code' });
        }

        if (participant.checked_in === 1) {
            console.log('[Checkin] Duplicate for:', participant.name);
            return res.json({
                success: true,
                isDuplicate: true,
                message: 'Already Checked In',
                participant: {
                    name: participant.name,
                    email: participant.email,
                    checkin_time: participant.checkin_time
                }
            });
        }

        const updateStmt = db.prepare("UPDATE participants SET checked_in = 1, checkin_time = datetime('now', 'localtime') WHERE id = ?");
        updateStmt.run(participant.id);

        const updatedParticipant = stmt.get(cleanCode);
        console.log('[Checkin] Success for:', updatedParticipant.name);

        res.json({
            success: true,
            isDuplicate: false,
            message: 'Check-in Successful',
            participant: {
                name: updatedParticipant.name,
                email: updatedParticipant.email,
                checkin_time: updatedParticipant.checkin_time
            }
        });
    } catch (err) {
        console.error('[Checkin] Server error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

export default router;
