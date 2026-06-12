import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, clearToken, saveToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const u = await api.me();
      setUser(u);
      return u;
    } catch {
      await clearToken();
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { token, user: u } = await api.login(email, password);
    await saveToken(token);
    setUser(u);
    return u;
  };

  const register = async (body) => {
    const { token, user: u } = await api.register(body);
    await saveToken(token);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
