import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, X } from 'lucide-react';

const LoanApprovals = () => {
    const { authFetch } = useAuth();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const fetchLoans = async () => {
        try {
            // First fetch pending, then all to mix if wanted. We'll fetch all.
            const res = await authFetch('/admin/loans');
            if (res.ok) {
                const data = await res.json();
                setLoans(data);
            }
        } catch (err) {
            console.error('Failed to fetch loans', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, [authFetch]);

    const handleAction = async (loanId, status) => {
        setProcessingId(loanId);
        try {
            const note = status === 'approved' ? 'Approved by Admin' : 'Rejected by Admin';
            const res = await authFetch(`/admin/loans/${loanId}`, {
                method: 'PUT',
                body: JSON.stringify({ status, adminNote: note })
            });
            if (res.ok) {
                await fetchLoans();
            } else {
                const errorData = await res.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (err) {
            alert('Failed to process loan');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div>Loading loans...</div>;

    const pendingLoans = loans.filter(l => l.status === 'pending');
    const otherLoans = loans.filter(l => l.status !== 'pending');

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Loan Approvals</h1>
                <p className="page-subtitle">Review and manage user loan applications.</p>
            </div>

            <div className="card" style={{ marginBottom: '32px' }}>
                <h2 className="card-title">Pending Applications ({pendingLoans.length})</h2>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Applicant</th>
                                <th>Purpose</th>
                                <th>Amount</th>
                                <th>Term/Rate</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingLoans.map(loan => (
                                <tr key={loan._id}>
                                    <td style={{ color: 'var(--text-muted)' }}>{new Date(loan.createdAt).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 500 }}>
                                        {loan.user?.name || 'Unknown'}
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{loan.user?.email}</div>
                                    </td>
                                    <td>{loan.purpose}</td>
                                    <td style={{ fontWeight: 600 }}>${loan.amount.toLocaleString()}</td>
                                    <td>
                                        {loan.termMonths}mo @ {loan.interestRate}%
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            ${loan.monthlyPayment}/mo
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                                disabled={processingId === loan._id}
                                                onClick={() => handleAction(loan._id, 'approved')}
                                            >
                                                <Check size={14} /> Approve
                                            </button>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                                disabled={processingId === loan._id}
                                                onClick={() => handleAction(loan._id, 'rejected')}
                                            >
                                                <X size={14} /> Deny
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {pendingLoans.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>No pending applications</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card">
                <h2 className="card-title">Recent Loan History</h2>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Applicant</th>
                                <th>Amount</th>
                                <th>Remaining</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {otherLoans.slice(0, 10).map(loan => (
                                <tr key={loan._id}>
                                    <td style={{ color: 'var(--text-muted)' }}>{new Date(loan.createdAt).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 500 }}>{loan.user?.name || 'Unknown'}</td>
                                    <td>${loan.amount.toLocaleString()}</td>
                                    <td>${loan.remainingBalance.toLocaleString()}</td>
                                    <td>
                                        <span className={`badge badge-${loan.status === 'active' ? 'primary' :
                                                loan.status === 'paid' ? 'success' : 'danger'
                                            }`}>
                                            {loan.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LoanApprovals;
