import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';

export default function DashboardPage() {
    const [stats, setStats] = useState({ total: 0, checkedIn: 0, notCheckedIn: 0 });
    const [participants, setParticipants] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Auto-refresh every 5s
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, listRes] = await Promise.all([
                axios.get('/api/admin/stats'),
                axios.get('/api/admin/participants')
            ]);
            setStats(statsRes.data);
            setParticipants(listRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredParticipants = participants.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        p.checkin_code.includes(search.toUpperCase())
    );

    return (
        <div className="page-container">
            <h1>後台統計儀表板 (Dashboard)</h1>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>總人數</h3>
                    <div className="stat-number">{stats.total}</div>
                </div>
                <div className="stat-card">
                    <h3>已報到</h3>
                    <div className="stat-number" style={{ color: 'var(--success-color)' }}>{stats.checkedIn}</div>
                </div>
                <div className="stat-card">
                    <h3>未報到</h3>
                    <div className="stat-number" style={{ color: '#aaa' }}>{stats.notCheckedIn}</div>
                </div>
            </div>

            {/* Participant List */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>參加者名單</h2>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                        <input
                            type="text"
                            placeholder="搜尋姓名、Email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: '100%', paddingLeft: '35px' }}
                        />
                    </div>
                </div>

                {loading ? (
                    <p>載入中...</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>狀態</th>
                                    <th>姓名</th>
                                    <th>Email</th>
                                    <th>報到碼</th>
                                    <th>報到時間</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredParticipants.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <span className={`status-badge ${p.checked_in ? 'status-checked' : 'status-pending'}`}>
                                                {p.checked_in ? '已報到' : '未報到'}
                                            </span>
                                        </td>
                                        <td>{p.name}</td>
                                        <td>{p.email}</td>
                                        <td style={{ fontFamily: 'monospace' }}>{p.checkin_code}</td>
                                        <td>{p.checkin_time || '-'}</td>
                                    </tr>
                                ))}
                                {filteredParticipants.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>無相符資料</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
