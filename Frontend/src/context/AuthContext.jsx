import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // On mount, if we have a token, we might want to fetch user profile
        // For now, if there's a token, we assume logged in. 
        // In a real app setup, we'd call an endpoint like GET /auth/me
        if (token) {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse user from local storage');
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await apiLogin(email, password);
            if (response.data && response.data.success) {
                const { user: userData, accessToken } = response.data.data;
                setToken(accessToken);
                setUser(userData);
                localStorage.setItem('token', accessToken);
                localStorage.setItem('user', JSON.stringify(userData));
                return { success: true };
            }
            return { success: false, message: 'Invalid response from server' };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (name, email, password) => {
        try {
            const response = await apiRegister({ name, email, password });
            if (response.data && response.data.success) {
                // According to authController, registration requires email verification
                // But it also returns tokens and user data. We can log them in.
                const { user: userData, accessToken } = response.data.data;
                setToken(accessToken);
                setUser(userData);
                localStorage.setItem('token', accessToken);
                localStorage.setItem('user', JSON.stringify(userData));
                return { success: true };
            }
            return { success: false, message: 'Invalid response from server' };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
