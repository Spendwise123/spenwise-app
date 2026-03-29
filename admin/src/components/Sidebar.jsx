import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    TrendingUp,
    Landmark,
    PieChart,
    LogOut
} from 'lucide-react';

const Sidebar = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'User Management', path: '/users', icon: <Users size={20} /> },
        { name: 'Investments', path: '/investments', icon: <TrendingUp size={20} /> },
        { name: 'Loan Approvals', path: '/loans', icon: <Landmark size={20} /> },
        { name: 'Reports', path: '/reports', icon: <PieChart size={20} /> },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">💎</div>
                <div className="sidebar-title">WealthWise Admin</div>
            </div>

            <nav className="nav-links">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="user-profile">
                <div className="user-info">
                    <span className="user-name">{currentUser?.name || 'Admin User'}</span>
                    <span className="user-role">Administrator</span>
                </div>
                <button onClick={handleLogout} className="logout-btn" title="Logout">
                    <LogOut size={20} />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
