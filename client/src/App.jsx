import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import UploadPage from './pages/UploadPage';
import CheckinPage from './pages/CheckinPage';
import DashboardPage from './pages/DashboardPage';
import { LayoutDashboard, QrCode, Upload, Menu, X } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const getLinkClass = (path) => {
        return location.pathname === path ? "nav-link active" : "nav-link";
    };

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className="navbar">
            <div className="nav-brand">活動報到小幫手</div>
            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
                <Link to="/" className={getLinkClass('/')} onClick={closeMenu}>
                    <Upload size={18} /> 上傳名單
                </Link>
                <Link to="/checkin" className={getLinkClass('/checkin')} onClick={closeMenu}>
                    <QrCode size={18} /> 現場報到
                </Link>
                <Link to="/dashboard" className={getLinkClass('/dashboard')} onClick={closeMenu}>
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
