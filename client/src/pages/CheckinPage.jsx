import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

// #3: Sound effects using Web Audio API
const createBeep = (frequency, duration, type = 'sine') => {
    return () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = frequency;
            osc.type = type;
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch (e) { /* ignore audio errors */ }
    };
};

const playSuccess = createBeep(880, 0.3);
const playDuplicate = () => { createBeep(440, 0.15)(); setTimeout(() => createBeep(440, 0.15)(), 200); };
const playError = createBeep(220, 0.5, 'square');

export default function CheckinPage() {
    const [manualCode, setManualCode] = useState('');
    const [result, setResult] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const scannerRef = useRef(null);
    const isProcessingRef = useRef(false);

    useEffect(() => {
        Html5Qrcode.getCameras().then((devices) => {
            if (devices && devices.length > 0) {
                setCameras(devices);
                setSelectedCamera(devices[0].id);
            }
        }).catch(err => {
            console.log('Unable to get cameras', err);
        });

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
                scannerRef.current.clear();
                scannerRef.current = null;
            }
        };
    }, []);

    const handleCheckin = useCallback(async (code) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        try {
            const response = await axios.post('/api/checkin', { code });
            setResult(response.data);
            // #3: Play sound based on result
            if (response.data.success && !response.data.isDuplicate) {
                playSuccess();
                // Vibrate on mobile
                if (navigator.vibrate) navigator.vibrate(200);
            } else if (response.data.isDuplicate) {
                playDuplicate();
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setResult({ success: false, message: '查無此代碼 (Invalid Code)' });
            } else {
                setResult({ success: false, message: '伺服器錯誤 (Server Error)' });
            }
            playError();
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        } finally {
            isProcessingRef.current = false;
        }
    }, []);

    const startScanning = async () => {
        if (scanning || !selectedCamera) return;

        if (scannerRef.current) {
            try { await scannerRef.current.stop(); } catch { }
            try { scannerRef.current.clear(); } catch { }
        }

        scannerRef.current = new Html5Qrcode("reader");

        try {
            await scannerRef.current.start(
                selectedCamera,
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    handleCheckin(decodedText);
                    stopScanning();
                },
                () => { }
            );
            setScanning(true);
        } catch (err) {
            console.error('Failed to start scanner', err);
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current) {
            try { await scannerRef.current.stop(); } catch { }
        }
        setScanning(false);
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualCode.trim()) {
            handleCheckin(manualCode.trim());
            setManualCode('');
        }
    };

    const resetAndScanAgain = () => {
        setResult(null);
        startScanning();
    };

    return (
        <div className="checkin-container">
            <h1>現場報到 (Check-in)</h1>

            <div className="scanner-box">
                <div id="reader" style={{ width: '100%' }}></div>

                {cameras.length > 0 && (
                    <div className="scanner-controls">
                        <select
                            value={selectedCamera}
                            onChange={(e) => setSelectedCamera(e.target.value)}
                            disabled={scanning}
                        >
                            {cameras.map((cam) => (
                                <option key={cam.id} value={cam.id}>
                                    {cam.label || `Camera ${cam.id}`}
                                </option>
                            ))}
                        </select>

                        {!scanning ? (
                            <button className="btn-scan" onClick={startScanning}>
                                📷 開始掃描
                            </button>
                        ) : (
                            <button className="btn-stop" onClick={stopScanning}>
                                ⏹ 停止掃描
                            </button>
                        )}
                    </div>
                )}

                {cameras.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>
                        未偵測到攝影機，請使用手動輸入報到碼
                    </p>
                )}
            </div>

            <form className="manual-input" onSubmit={handleManualSubmit}>
                <input
                    type="text"
                    placeholder="手動輸入 6 碼代碼"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    maxLength={6}
                />
                <button type="submit">報到</button>
            </form>

            {result && (
                <div className={`result-card ${result.success ? (result.isDuplicate ? 'result-duplicate' : 'result-success') : 'result-error'}`}>
                    <div className="result-header">
                        {result.success ? (
                            result.isDuplicate ? (
                                <AlertTriangle className="check-icon" style={{ color: 'var(--warning-color)' }} />
                            ) : (
                                <CheckCircle className="check-icon" />
                            )
                        ) : (
                            <XCircle className="check-icon" style={{ color: 'var(--error-color)' }} />
                        )}

                        <h2 style={{ color: result.success ? (result.isDuplicate ? 'var(--warning-color)' : 'var(--success-color)') : 'var(--error-color)' }}>
                            {result.message}
                        </h2>
                    </div>

                    {result.participant && (
                        <div className="participant-info">
                            <h3>{result.participant.name}</h3>
                            <p>{result.participant.email}</p>
                            {result.isDuplicate && (
                                <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                                    首次報到時間: {result.participant.checkin_time}
                                </p>
                            )}
                            {result.success && !result.isDuplicate && (
                                <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                                    報到時間: {new Date().toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}

                    <button className="btn-scan-again" onClick={resetAndScanAgain}>
                        🔄 繼續掃描下一位
                    </button>
                </div>
            )}
        </div>
    );
}
