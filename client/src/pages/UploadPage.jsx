import { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, AlertTriangle, MessageSquare, CheckCircle, Loader } from 'lucide-react';

export default function UploadPage() {
    const [file, setFile] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [skipped, setSkipped] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [emailStatus, setEmailStatus] = useState(null); // null | 'sending' | {sent, failed, message}
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.csv')) {
                setFile(droppedFile);
                setError('');
            } else {
                setError('請上傳 .csv 格式的檔案');
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('請選擇一個 CSV 檔案');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        setSkipped([]);
        setEmailStatus(null);
        try {
            const response = await axios.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setParticipants(response.data.participants);
            if (response.data.skippedList && response.data.skippedList.length > 0) {
                setSkipped(response.data.skippedList);
            }
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error(err);
            setError('上傳失敗，請確認檔案格式正確');
        } finally {
            setLoading(false);
        }
    };

    // Send QR codes via MS Teams
    const handleSendTeams = async (useSkipped = false) => {
        const sourceList = useSkipped ? skipped : participants;
        if (sourceList.length === 0) return;

        setEmailStatus('sending');
        try {
            // Send to Teams webhook
            const participantIds = sourceList.map(p => {
                // If skipped, we still have their email, we can fetch checkin_code
                return p.checkin_code;
            });

            // Note: Currently skipped items from backend might lack checkin_code 
            // if we only return name/email/reason.
            // Let's send an empty array to tell backend to send to EVERYONE in DB 
            // if we are trying to send skipped ones, OR we can just hit /api/teams/send 
            // with no body to send to all.
            const payload = useSkipped ? {} : { participantIds };

            const response = await axios.post('/api/teams/send', payload);
            setEmailStatus(response.data);
        } catch (err) {
            const msg = err.response?.data?.message || 'Teams 通知發送失敗';
            setEmailStatus({ sent: 0, failed: 0, message: msg });
        }
    };

    return (
        <div className="page-container">
            <h1>上傳參加者名單 (CSV)</h1>
            <p style={{ color: '#aaa', marginBottom: '2rem' }}>
                請上傳包含「姓名」與「Email」欄位的 CSV 檔案。系統將自動產生報到碼與 QR Code。
            </p>

            <div className="card">
                <div
                    className={`upload-area ${dragActive ? 'upload-area-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload size={48} style={{ marginBottom: '1rem', color: dragActive ? '#4ade80' : '#646cff' }} />
                    <br />
                    {file ? (
                        <p style={{ color: '#4ade80', fontWeight: 'bold' }}>已選取: {file.name}</p>
                    ) : (
                        <p>拖放 CSV 檔案到這裡，或點擊選擇檔案</p>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button onClick={handleUpload} disabled={!file || loading}>
                        {loading ? '處理中...' : '開始上傳與產生 QR Code'}
                    </button>
                </div>
                {error && <p style={{ color: '#ef4444', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
            </div>

            {/* Skipped duplicates warning & Actions */}
            {skipped.length > 0 && (
                <div className="card" style={{ borderLeft: '4px solid var(--warning-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={20} style={{ color: 'var(--warning-color)' }} />
                            <h3 style={{ margin: 0, color: 'var(--warning-color)' }}>已跳過 {skipped.length} 筆重複資料</h3>
                        </div>
                        <button
                            className="btn-teams"
                            onClick={() => handleSendTeams(true)}
                            disabled={emailStatus === 'sending'}
                            style={{
                                backgroundColor: emailStatus === 'sending' ? '#555' : '#4f46e5',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                fontSize: '0.9rem',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: emailStatus === 'sending' ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {emailStatus === 'sending' ? (
                                <><Loader size={16} className="spin-icon" /> 發送中...</>
                            ) : (
                                <><MessageSquare size={16} /> 發送 Teams 通知給「資料庫所有人」</>
                            )}
                        </button>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#aaa', marginBottom: '1rem' }}>
                        {skipped.map((s, i) => (
                            <li key={i}>{s.name} ({s.email}) — {s.reason}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Upload results + Email button */}
            {participants.length > 0 && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                        <h2 style={{ margin: 0 }}>成功新增 {participants.length} 位參加者</h2>
                        <button
                            className="btn-teams"
                            onClick={handleSendTeams}
                            disabled={emailStatus === 'sending'}
                            style={{
                                backgroundColor: emailStatus === 'sending' ? '#555' : '#4f46e5', // Teams purple-ish
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.7rem 1.5rem',
                                fontSize: '1rem',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: emailStatus === 'sending' ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {emailStatus === 'sending' ? (
                                <><Loader size={18} className="spin-icon" /> 發送中...</>
                            ) : (
                                <><MessageSquare size={18} /> 發送 Teams 通知給所有人</>
                            )}
                        </button>
                    </div>

                    {/* Email status result */}
                    {emailStatus && emailStatus !== 'sending' && (
                        <div className="card" style={{
                            borderLeft: `4px solid ${emailStatus.failed > 0 ? 'var(--warning-color)' : 'var(--success-color)'}`,
                            marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {emailStatus.sent > 0 ? (
                                    <CheckCircle size={20} style={{ color: 'var(--success-color)' }} />
                                ) : (
                                    <AlertTriangle size={20} style={{ color: 'var(--warning-color)' }} />
                                )}
                                <span>{emailStatus.message}</span>
                            </div>
                            {emailStatus.errors && emailStatus.errors.length > 0 && (
                                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: '#aaa', fontSize: '0.9rem' }}>
                                    {emailStatus.errors.map((e, i) => (
                                        <li key={i}>{e.name} ({e.email}): {e.error}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <div className="participant-list">
                        {participants.map((p) => (
                            <div key={p.checkin_code} className="participant-card">
                                <h3>{p.name}</h3>
                                <p style={{ fontSize: '0.9rem', color: '#aaa' }}>{p.email}</p>
                                <img src={p.qr_data} alt="QR Code" className="qr-img" />
                                <p style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 'bold' }}>{p.checkin_code}</p>
                                <a
                                    href={p.qr_data}
                                    download={`qrcode-${p.name}.png`}
                                    style={{ fontSize: '0.8rem', color: '#646cff', textDecoration: 'none' }}
                                >
                                    下載 QR Code
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
