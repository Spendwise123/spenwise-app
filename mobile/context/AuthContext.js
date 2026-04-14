// mobile/context/AuthContext.js
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

    // Restore session from AsyncStorage on mount
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const stored = await AsyncStorage.getItem('user');
                const storedToken = await AsyncStorage.getItem('token');
                if (stored && storedToken) {
                    setCurrentUser(JSON.parse(stored));
                    setToken(storedToken);
                }
            } catch (err) {
                console.log('Session restore failed:', err.message);
            }
            setLoading(false);
        };
        restoreSession();
    }, []);

    const login = async (email, password) => {
        const response = await fetch(`${API_URL}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.detail || 'Login failed');
        }

        const { token, ...user } = data;
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('token', token);
        setToken(token);
        setCurrentUser(user);
        return user;
    };

    const signup = async (name, email, password) => {
        const response = await fetch(`${API_URL}/auth/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, first_name: name })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.detail || 'Signup failed');
        }

        const { token, ...user } = data;
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('token', token);
        setToken(token);
        setCurrentUser(user);
        return user;
    };

    const logout = async () => {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('token');
        setToken(null);
        setCurrentUser(null);
    };

    const getToken = async () => {
        return await AsyncStorage.getItem('token');
    };

    const authFetch = async (urlSuffix, options = {}) => {
        const currentToken = token || await AsyncStorage.getItem('token');
        
        // Ensure trailing slash for Django if missing
        let targetUrl = urlSuffix.startsWith('http') ? urlSuffix : `${API_URL}${urlSuffix}`;
        if (!targetUrl.includes('?') && !targetUrl.endsWith('/')) {
            targetUrl += '/';
        }

        try {
            const response = await fetch(targetUrl, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`,
                    ...options.headers
                }
            });

            const contentType = response.headers.get('content-type');
            let data = {};
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Return a structured error if not JSON
                return {
                    ok: false,
                    status: response.status,
                    json: async () => ({ message: 'Server returned non-JSON response' })
                };
            }
            
            // Standardize ID mapping: Django 'id' -> '_id'
            const mapId = (item) => ({ ...item, _id: item.id || item._id, id: item.id || item._id });

            if (Array.isArray(data)) {
                const mappedData = data.map(mapId);
                return {
                    ok: response.ok,
                    status: response.status,
                    json: async () => mappedData
                };
            }
            
            const mappedData = mapId(data);
            return {
                ok: response.ok,
                status: response.status,
                json: async () => mappedData
            };
        } catch (error) {
            console.log(`Fetch Error (${urlSuffix}):`, error);
            return {
                ok: false,
                status: 500,
                json: async () => ({ message: 'Network error or server unreachable' })
            };
        }
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
