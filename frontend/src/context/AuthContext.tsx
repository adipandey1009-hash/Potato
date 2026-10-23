import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '../types';
import { apiRequest } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('potato_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('potato_access_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshMe = useCallback(async () => {
    const storedToken = localStorage.getItem('potato_access_token');
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const u = await apiRequest<User>('/api/v1/auth/me');
      setUser(u);
      localStorage.setItem('potato_user', JSON.stringify(u));
    } catch {
      setUser(null);
      localStorage.removeItem('potato_user');
      localStorage.removeItem('potato_access_token');
      localStorage.removeItem('potato_refresh_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();

    const handleAuthCleared = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('potato_auth_cleared', handleAuthCleared);
    return () => window.removeEventListener('potato_auth_cleared', handleAuthCleared);
  }, [refreshMe]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiRequest<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('potato_access_token', res.accessToken);
    localStorage.setItem('potato_refresh_token', res.refreshToken);
    localStorage.setItem('potato_user', JSON.stringify(res.user));
    setToken(res.accessToken);
    setUser(res.user);
    return res.user;
  };

  const register = async (fullName: string, email: string, password: string): Promise<User> => {
    const res = await apiRequest<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    });
    localStorage.setItem('potato_access_token', res.accessToken);
    localStorage.setItem('potato_refresh_token', res.refreshToken);
    localStorage.setItem('potato_user', JSON.stringify(res.user));
    setToken(res.accessToken);
    setUser(res.user);
    return res.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('potato_access_token');
      localStorage.removeItem('potato_refresh_token');
      localStorage.removeItem('potato_user');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
