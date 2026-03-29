import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    Title, Tooltip, Legend, ArcElement
);

const Reports = () => {
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
                console.error('Failed to fetch analytics', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [authFetch]);

    if (loading) return <div>Loading analytics...</div>;

    // Placeholder static charts based on aggregated logic
    const portfolioData = {
        labels: ['Stocks', 'Crypto', 'Real Estate', 'Bonds'],
        datasets: [
            {
                data: [45, 25, 20, 10],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(99, 102, 241, 0.8)',
                ],
                borderWidth: 0,
            },
        ],
    };

    const revenueData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Platform Revenue ($)',
                data: [12000, 19000, 15000, 22000, 28000, 32000],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const loanData = {
        labels: ['Active', 'Paid', 'Defaulted'],
        datasets: [
            {
                label: 'Loan Status Distribution',
                data: [
                    stats?.totalLoans || 0,
                    Math.floor((stats?.totalLoans || 0) * 0.4),
                    Math.floor((stats?.totalLoans || 0) * 0.05),
                ],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                ],
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#94A3B8' }
            }
        },
        scales: {
            y: { ticks: { color: '#94A3B8' }, grid: { color: '#334155' } },
            x: { ticks: { color: '#94A3B8' }, grid: { display: false } },
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right', labels: { color: '#94A3B8' } }
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Reports & Analytics</h1>
                <p className="page-subtitle">Comprehensive financial data insights.</p>
            </div>

            <div className="card" style={{ marginBottom: '32px' }}>
                <h2 className="card-title">Revenue Growth</h2>
                <div style={{ height: '300px' }}>
                    <Line data={revenueData} options={chartOptions} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div className="card">
                    <h2 className="card-title">Investment Portfolio Breakdown</h2>
                    <div style={{ height: '250px' }}>
                        <Doughnut data={portfolioData} options={pieOptions} />
                    </div>
                </div>

                <div className="card">
                    <h2 className="card-title">Loan Status Summaries</h2>
                    <div style={{ height: '250px' }}>
                        <Bar data={loanData} options={chartOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
