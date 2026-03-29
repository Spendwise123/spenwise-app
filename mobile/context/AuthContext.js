import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('token');
                if (storedToken) {
                    const res = await fetch(`${API_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });
                    if (res.ok) {
                        const user = await res.json();
                        setCurrentUser(user);
                        setToken(storedToken);
                    } else {
                        await AsyncStorage.removeItem('token');
                    }
                }
            } catch {
                await AsyncStorage.removeItem('token');
            }
            setLoading(false);
        };
        restoreSession();
    }, []);

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

        await AsyncStorage.setItem('token', data.token);
        setToken(data.token);
        setCurrentUser({ id: data.id, name: data.name, email: data.email, role: data.role });
        return data;
    };

    const signup = async (name, email, password) => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Signup failed');
        }

        await AsyncStorage.setItem('token', data.token);
        setToken(data.token);
        setCurrentUser({ id: data.id, name: data.name, email: data.email, role: data.role });
        return data;
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        setToken(null);
        setCurrentUser(null);
    };

    const getToken = async () => {
        return await AsyncStorage.getItem('token');
    };

    const authFetch = async (url, options = {}) => {
        const storedToken = await getToken();
        return fetch(`${API_URL}${url}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${storedToken}`,
                ...options.headers,
            },
        });
    };

    const value = {
        currentUser,
        login,
        signup,
        logout,
        loading,
        token,
        getToken,
        authFetch,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
