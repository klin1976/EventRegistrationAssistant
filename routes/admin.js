import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/admin/participants
router.get('/participants', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM participants ORDER BY id DESC');
        const participants = stmt.all();
        res.json(participants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/stats
router.get('/stats', (req, res) => {
    try {
        const totalStmt = db.prepare('SELECT COUNT(*) as count FROM participants');
        const checkedInStmt = db.prepare('SELECT COUNT(*) as count FROM participants WHERE checked_in = 1');

        const total = totalStmt.get().count;
        const checkedIn = checkedInStmt.get().count;

        res.json({
            total,
            checkedIn,
            notCheckedIn: total - checkedIn
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
