import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth as authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    const token = data.token || data.accessToken;
    const userData = data.user || { email, name: data.name };
    if (token) localStorage.setItem('token', token);
    setUser(userData);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    const token = data.token || data.accessToken;
    const userData = data.user || { email: payload.email, name: payload.name };
    if (token) localStorage.setItem('token', token);
    setUser(userData);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const demoLogin = useCallback(() => {
    localStorage.setItem('token', 'demo-token');
    setUser({ email: 'demo@plant.com', name: 'Demo Operator' });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ email: 'user', name: 'Operator' });
    }
    setLoading(false);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    demoLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
