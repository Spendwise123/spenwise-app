import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const InvestmentManagement = () => {
    // In a real app we'd fetch all investments system-wide.
    // We'll simulate fetching all users' investments via admin aggregates for now

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Investment Management</h1>
                <p className="page-subtitle">System-wide investment portfolio analytics.</p>
            </div>

            <div className="card">
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                    <h3>Global Investment Oversight</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                        System aggregate dashboard for investments is configured via the main Dashboard stats.
                        Detailed individual user portfolios are accessible via the User profiles view.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InvestmentManagement;
