import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import CheckinPage from './pages/CheckinPage';
import DashboardPage from './pages/DashboardPage';
import { LayoutDashboard, QrCode, Upload } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    const getLinkClass = (path) => {
        return location.pathname === path
            ? "nav-link active"
            : "nav-link";
    };

    return (
        <nav className="navbar">
            <div className="nav-brand">活動報到小幫手</div>
            <div className="nav-links">
                <Link to="/" className={getLinkClass('/')}>
                    <Upload size={18} /> 上傳名單
                </Link>
                <Link to="/checkin" className={getLinkClass('/checkin')}>
                    <QrCode size={18} /> 現場報到
                </Link>
                <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                    <LayoutDashboard size={18} /> 統計儀表板
                </Link>
            </div>
        </nav>
    );
};

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="app-container">
                <Navbar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<UploadPage />} />
                        <Route path="/checkin" element={<CheckinPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
