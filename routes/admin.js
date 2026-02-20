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

// #8: GET /api/admin/qrcodes - batch download all QR codes as JSON (for ZIP on client)
router.get('/qrcodes', (req, res) => {
    try {
        const stmt = db.prepare('SELECT name, checkin_code, qr_data FROM participants');
        const participants = stmt.all();
        res.json(participants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/participants/:id - delete a participant
router.delete('/participants/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM participants WHERE id = ?');
        const result = stmt.run(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/participants - clear all participants
router.delete('/participants', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM participants');
        stmt.run();
        res.json({ success: true, message: 'All participants cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
