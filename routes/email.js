import express from 'express';
import nodemailer from 'nodemailer';
import db from '../db.js';

const router = express.Router();

// POST /api/email/send - Send QR codes to participants via email
router.post('/send', async (req, res) => {
    const { participantIds } = req.body; // array of IDs, or empty to send to all unsent

    // Validate SMTP config
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        return res.status(400).json({
            success: false,
            message: 'SMTP 尚未設定，請在 .env 檔案中設定 SMTP_HOST、SMTP_USER、SMTP_PASS'
        });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587'),
        secure: (SMTP_PORT === '465'),
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    try {
        // Get participants to email
        let participants;
        if (participantIds && participantIds.length > 0) {
            const placeholders = participantIds.map(() => '?').join(',');
            const stmt = db.prepare(`SELECT * FROM participants WHERE id IN (${placeholders})`);
            participants = stmt.all(...participantIds);
        } else {
            // Send to all participants
            const stmt = db.prepare('SELECT * FROM participants');
            participants = stmt.all();
        }

        if (participants.length === 0) {
            return res.json({ success: true, sent: 0, failed: 0, message: 'No participants to send to' });
        }

        const fromAddress = SMTP_FROM || SMTP_USER;
        const eventName = process.env.EVENT_NAME || '活動報到';
        let sent = 0;
        let failed = 0;
        const errors = [];

        for (const p of participants) {
            try {
                // Convert base64 data URL to buffer for attachment
                const qrBase64 = p.qr_data.replace(/^data:image\/png;base64,/, '');

                await transporter.sendMail({
                    from: `"${eventName}" <${fromAddress}>`,
                    to: p.email,
                    subject: `${eventName} - 您的報到 QR Code`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #646cff; text-align: center;">${eventName}</h2>
                            <hr style="border: 1px solid #eee;" />
                            <p>親愛的 <strong>${p.name}</strong>，您好！</p>
                            <p>感謝您的報名，以下是您的報到資訊：</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px; border: 2px solid #eee; border-radius: 8px;" />
                                <p style="font-size: 24px; font-weight: bold; font-family: monospace; color: #333; margin-top: 15px;">
                                    報到碼：${p.checkin_code}
                                </p>
                            </div>
                            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0; color: #666;">📱 活動現場請出示此 QR Code 或告知報到碼即可完成報到。</p>
                            </div>
                            <hr style="border: 1px solid #eee;" />
                            <p style="font-size: 12px; color: #999; text-align: center;">此信件由活動報到系統自動發送</p>
                        </div>
                    `,
                    attachments: [{
                        filename: `qrcode-${p.checkin_code}.png`,
                        content: Buffer.from(qrBase64, 'base64'),
                        cid: 'qrcode'
                    }]
                });
                sent++;
            } catch (emailErr) {
                failed++;
                errors.push({ name: p.name, email: p.email, error: emailErr.message });
                console.error(`[Email] Failed to send to ${p.email}:`, emailErr.message);
            }
        }

        res.json({
            success: true,
            sent,
            failed,
            total: participants.length,
            errors: errors.length > 0 ? errors : undefined,
            message: `成功寄出 ${sent} 封，失敗 ${failed} 封`
        });

    } catch (err) {
        console.error('[Email] Server error:', err);
        res.status(500).json({ success: false, message: 'Email 發送失敗: ' + err.message });
    }
});

// POST /api/email/test - Test SMTP connection
router.post('/test', async (req, res) => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        return res.status(400).json({
            success: false,
            message: 'SMTP 尚未設定'
        });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: parseInt(SMTP_PORT || '587'),
            secure: (SMTP_PORT === '465'),
            auth: { user: SMTP_USER, pass: SMTP_PASS },
        });

        await transporter.verify();
        res.json({ success: true, message: 'SMTP 連線測試成功' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'SMTP 連線失敗: ' + err.message });
    }
});

export default router;
