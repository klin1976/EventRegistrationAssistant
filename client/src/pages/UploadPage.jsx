import { useState } from 'react';
import axios from 'axios';
import { Upload } from 'lucide-react';

export default function UploadPage() {
    const [file, setFile] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
    };

    const handleUpload = async () => {
        if (!file) {
            setError('請選擇一個 CSV 檔案');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const response = await axios.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setParticipants(response.data.participants);
            setFile(null); // Clear file input
        } catch (err) {
            console.error(err);
            setError('上傳失敗，請確認檔案格式正確 (Upload Failed)');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <h1>上傳參加者名單 (CSV)</h1>
            <p style={{ color: '#aaa', marginBottom: '2rem' }}>
                請上傳包含「姓名」與「Email」欄位的 CSV 檔案。系統將自動產生報到碼與 QR Code。
            </p>

            <div className="card">
                <div className="upload-area">
                    <Upload size={48} style={{ marginBottom: '1rem', color: '#646cff' }} />
                    <br />
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        style={{ display: 'block', margin: '0 auto' }}
                    />
                    <br />
                    <button onClick={handleUpload} disabled={!file || loading}>
                        {loading ? '處理中...' : '開始上傳與產生 QR Code'}
                    </button>
                    {error && <p style={{ color: '#ef4444', marginTop: '1rem' }}>{error}</p>}
                </div>
            </div>

            {participants.length > 0 && (
                <div>
                    <h2>新增參加者 ({participants.length})</h2>
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
