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
            return res.status(404).json({ success: false, message: '參加者代碼無效 (Invalid Code)' });
        }

        if (participant.checked_in === 1) {
            console.log('[Checkin] Duplicate check-in for:', participant.name);
            return res.json({
                success: true,
                isDuplicate: true,
                message: '此代碼已報到過 (Already Checked In)',
                participant: {
                    name: participant.name,
                    email: participant.email,
                    checkin_time: participant.checkin_time
                }
            });
        }

        // Perform Check-in
        const updateStmt = db.prepare('UPDATE participants SET checked_in = 1, checkin_time = datetime("now", "localtime") WHERE id = ?');
        updateStmt.run(participant.id);

        // Fetch updated participant
        const updatedParticipant = stmt.get(cleanCode);
        console.log('[Checkin] Success for:', updatedParticipant.name);

        res.json({
            success: true,
            isDuplicate: false,
            message: '報到成功 ✅',
            participant: {
                name: updatedParticipant.name,
                email: updatedParticipant.email,
                checkin_time: updatedParticipant.checkin_time
            }
        });
    } catch (err) {
        console.error('[Checkin] Server error:', err);
        res.status(500).json({ success: false, message: '伺服器內部錯誤' });
    }
});

export default router;
