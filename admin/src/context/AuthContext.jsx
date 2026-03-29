import { createContext, useState, useContext, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('adminToken') || null);

    useEffect(() => {
        const restoreSession = async () => {
            if (token) {
                try {
                    const res = await fetch(`${API_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const user = await res.json();
                        if (user.role === 'admin') {
                            setCurrentUser(user);
                        } else {
                            // Not an admin
                            logout();
                        }
                    } else {
                        logout();
                    }
                } catch {
                    logout();
                }
            }
            setLoading(false);
        };
        restoreSession();
    }, [token]);

    const login = async (email, password) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Login failed');
        }

        if (data.role !== 'admin') {
            throw new Error('Access denied. Admin privileges required.');
        }

        localStorage.setItem('adminToken', data.token);
        setToken(data.token);
        setCurrentUser(data);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        setToken(null);
        setCurrentUser(null);
    };

    const authFetch = async (endpoint, options = {}) => {
        return fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...options.headers,
            },
        });
    };

    const value = {
        currentUser,
        login,
        logout,
        loading,
        authFetch
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
