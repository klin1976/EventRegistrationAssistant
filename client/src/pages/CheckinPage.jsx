import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export default function CheckinPage() {
    const [manualCode, setManualCode] = useState('');
    const [result, setResult] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const scannerRef = useRef(null);
    const containerRef = useRef(null);

    // Get available cameras on mount
    useEffect(() => {
        Html5Qrcode.getCameras().then((devices) => {
            if (devices && devices.length > 0) {
                setCameras(devices);
                setSelectedCamera(devices[0].id);
            }
        }).catch(err => {
            console.log('Unable to get cameras', err);
        });

        // Cleanup on unmount
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
                scannerRef.current.clear();
                scannerRef.current = null;
            }
        };
    }, []);

    const startScanning = async () => {
        if (scanning || !selectedCamera) return;

        // Create fresh scanner instance
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
                    // Stop after successful scan to prevent rapid re-scans
                    stopScanning();
                },
                () => { /* ignore scan errors */ }
            );
            setScanning(true);
        } catch (err) {
            console.error('Failed to start scanner', err);
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
            } catch { }
        }
        setScanning(false);
    };

    const handleCheckin = async (code) => {
        try {
            const response = await axios.post('/api/checkin', { code });
            setResult(response.data);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setResult({ success: false, message: '查無此代碼 (Invalid Code)' });
            } else {
                setResult({ success: false, message: '伺服器錯誤 (Server Error)' });
            }
        }
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

            {/* Scanner Area */}
            <div className="scanner-box">
                <div id="reader" ref={containerRef} style={{ width: '100%' }}></div>

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

            {/* Manual Input */}
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

            {/* Result Display */}
            {result && (
                <div className={`result-card ${result.success ? (result.isDuplicate ? 'result-duplicate' : 'result-success') : ''}`}>
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
