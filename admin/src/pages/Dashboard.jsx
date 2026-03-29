import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    TrendingUp,
    Landmark,
    PiggyBank
} from 'lucide-react';

const Dashboard = () => {
    const { authFetch } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await authFetch('/admin/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard stats', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [authFetch]);

    if (loading) {
        return <div>Loading dashboard...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard Overview</h1>
                <p className="page-subtitle">Real-time platform statistics and activity.</p>
            </div>

            {stats && (
                <div className="card-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
                            <Users size={24} color="#3B82F6" />
                        </div>
                        <div className="stat-info">
                            <div className="stat-label">Total Users</div>
                            <div className="stat-value">{stats.totalUsers}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                            <TrendingUp size={24} color="#10B981" />
                        </div>
                        <div className="stat-info">
                            <div className="stat-label">Managed Assets</div>
                            <div className="stat-value">${stats.totalInvestmentValue?.toLocaleString() || 0}</div>
                            <div className="stat-label" style={{ fontSize: '12px', marginTop: '4px' }}>{stats.totalInvestments} active investments</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                            <PiggyBank size={24} color="#F59E0B" />
                        </div>
                        <div className="stat-info">
                            <div className="stat-label">Total Savings</div>
                            <div className="stat-value">${stats.totalSavedAmount?.toLocaleString() || 0}</div>
                            <div className="stat-label" style={{ fontSize: '12px', marginTop: '4px' }}>{stats.totalSavings} active goals</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                            <Landmark size={24} color="#EF4444" />
                        </div>
                        <div className="stat-info">
                            <div className="stat-label">Outstanding Loans</div>
                            <div className="stat-value">${stats.totalLoanRemaining?.toLocaleString() || 0}</div>
                            <div className="stat-label" style={{ fontSize: '12px', marginTop: '4px' }}>{stats.pendingLoans} pending approvals</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Additional dashboard widgets could go here */}
            <div className="card">
                <h2 className="card-title">System Health</h2>
                <p style={{ color: 'var(--text-muted)' }}>All services operational. API endpoints connected securely.</p>
            </div>
        </div>
    );
};

export default Dashboard;
