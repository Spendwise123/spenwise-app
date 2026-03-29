import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
    const { authFetch } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await authFetch('/admin/users');
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data);
                }
            } catch (err) {
                console.error('Failed to fetch users', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [authFetch]);

    if (loading) return <div>Loading users...</div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">User Management</h1>
                <p className="page-subtitle">View and manage all registered platform users.</p>
            </div>

            <div className="card">
                <h2 className="card-title">Registered Users ({users.length})</h2>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id}>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{user._id.substring(user._id.length - 6)}</td>
                                    <td style={{ fontWeight: 500 }}>{user.name}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{user.email}</td>
                                    <td>
                                        <span className={`badge ${user.role === 'admin' ? 'badge-info' : ''}`} style={{ backgroundColor: user.role === 'admin' ? 'var(--bg-hover)' : 'transparent' }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <span className="badge badge-success">Active</span>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>No users found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
