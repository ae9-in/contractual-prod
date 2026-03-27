import { createContext, useEffect, useMemo, useState } from 'react';
import { loginUser, registerUser } from '../services/authService';
import { connectRealtime, disconnectRealtime } from '../services/realtimeService';
import { clearStoredAuth, getStoredToken, getStoredUserRaw, setStoredAuth } from '../utils/authStorage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    const raw = getStoredUserRaw();
    if (token && raw) {
      try {
        setUser(JSON.parse(raw));
        connectRealtime();
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        clearStoredAuth();
      }
    } else if (token || raw) {
      // Clear partial auth state (token without user or user without token).
      clearStoredAuth();
    }
    setLoading(false);
  }, []);

  const login = async (payload) => {
    const { data } = await loginUser(payload);
    setStoredAuth(data.token, data.user);
    setUser(data.user);
    connectRealtime();
    return data.user;
  };

  const register = async (payload) => {
    await registerUser(payload);
  };

  const logout = () => {
    disconnectRealtime();
    clearStoredAuth();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, isAuthenticated: Boolean(user) }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
