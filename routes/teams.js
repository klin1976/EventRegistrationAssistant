import express from 'express';
import db from '../db.js';

const router = express.Router();

// POST /api/teams/send - Send check-in info to Teams via Power Automate Webhook
router.post('/send', async (req, res) => {
    const { participantIds } = req.body;
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

    if (!webhookUrl) {
        return res.status(400).json({
            success: false,
            message: 'TEAMS_WEBHOOK_URL 尚未設定於 .env 中'
        });
    }

    try {
        let participants;
        if (participantIds && participantIds.length > 0) {
            const placeholders = participantIds.map(() => '?').join(',');
            const stmt = db.prepare(`SELECT * FROM participants WHERE id IN (${placeholders})`);
            participants = stmt.all(...participantIds);
        } else {
            const stmt = db.prepare('SELECT * FROM participants');
            participants = stmt.all();
        }

        if (participants.length === 0) {
            return res.json({ success: true, sent: 0, failed: 0, message: '沒有參加者資料可發送' });
        }

        let sent = 0;
        let failed = 0;
        const errors = [];

        for (const p of participants) {
            try {
                // Prepare payload for Power Automate webhook (Adaptive Card format)
                const payload = {
                    type: "AdaptiveCard",
                    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
                    version: "1.4",
                    body: [
                        {
                            type: "TextBlock",
                            text: `活動報到通知：${p.name}`,
                            weight: "Bolder",
                            size: "Medium"
                        },
                        {
                            type: "TextBlock",
                            text: `Email: ${p.email}`,
                            isSubtle: true,
                            wrap: true
                        },
                        {
                            type: "FactSet",
                            facts: [
                                {
                                    title: "報到碼",
                                    value: p.checkin_code
                                }
                            ]
                        },
                        {
                            type: "Image",
                            url: p.qr_data,
                            size: "Large",
                            altText: "QR Code"
                        }
                    ]
                };

                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok || response.status === 202) {
                    sent++;
                } else {
                    failed++;
                    errors.push({ name: p.name, email: p.email, error: `HTTP ${response.status}` });
                    console.error(`[Teams] HTTP error: ${response.status} ${response.statusText}`);
                }
            } catch (err) {
                failed++;
                errors.push({ name: p.name, email: p.email, error: err.message });
                console.error(`[Teams] Failed to send webhook for ${p.name}:`, err);
            }
        }

        res.json({
            success: true,
            sent,
            failed,
            total: participants.length,
            errors: errors.length > 0 ? errors : undefined,
            message: `成功發送 ${sent} 則，失敗 ${failed} 則`
        });
    } catch (err) {
        console.error('[Teams] Server error:', err);
        res.status(500).json({ success: false, message: 'Teams 通知發送失敗: ' + err.message });
    }
});

export default router;
