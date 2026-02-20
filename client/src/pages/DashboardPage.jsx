import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download } from 'lucide-react';

export default function DashboardPage() {
    const [stats, setStats] = useState({ total: 0, checkedIn: 0, notCheckedIn: 0 });
    const [participants, setParticipants] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
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

    // #5: Export CSV
    const exportCSV = () => {
        const headers = ['姓名', 'Email', '報到碼', '狀態', '報到時間'];
        const rows = participants.map(p => [
            p.name,
            p.email,
            p.checkin_code,
            p.checked_in ? '已報到' : '未報到',
            p.checkin_time || ''
        ]);

        // Add BOM for Excel compatibility
        const bom = '\uFEFF';
        const csvContent = bom + [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `checkin-report-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // #6: Progress ring calculation
    const percentage = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;
    const radius = 65;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="page-container">
            <h1>後台統計儀表板 (Dashboard)</h1>

            {/* #6: Progress Ring */}
            <div className="progress-ring-container">
                <div className="progress-ring-wrapper">
                    <svg width="100%" height="100%" viewBox="0 0 160 160">
                        <circle className="progress-ring-bg" cx="80" cy="80" r={radius} />
                        <circle
                            className="progress-ring-fill"
                            cx="80" cy="80" r={radius}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                        />
                    </svg>
                    <div className="progress-ring-text">
                        <div className="percentage">{percentage}%</div>
                        <div className="label">報到率</div>
                    </div>
                </div>
            </div>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h2 style={{ margin: 0 }}>參加者名單</h2>
                    <div className="dashboard-actions">
                        {/* #5: Export button */}
                        <button className="btn-export" onClick={exportCSV} disabled={participants.length === 0}>
                            <Download size={16} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                            匯出 CSV
                        </button>
                        <div style={{ position: 'relative', minWidth: '200px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                            <input
                                type="text"
                                placeholder="搜尋姓名、Email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ width: '100%', paddingLeft: '35px', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="skeleton-container">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="skeleton-row" style={{ height: '3rem', backgroundColor: '#3a3a3a', borderRadius: '6px', marginBottom: '0.5rem', animation: 'pulse 1.5s infinite' }}></div>
                        ))}
                    </div>
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
