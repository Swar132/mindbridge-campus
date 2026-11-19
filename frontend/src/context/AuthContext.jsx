import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch (err) {
        console.error('Failed to authenticate session:', err);
        setAuthToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setAuthToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    setAuthToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    try {
      api.logout().catch(() => {});
    } catch (e) {
      // ignore
    }
    setAuthToken(null);
    setUser(null);
  };

  const demoLogin = async (role = 'student') => {
    let email = 'student@mindbridge.edu';
    let password = 'student123';
    if (role === 'counsellor') {
      email = 'nitusingh_b@dau.ac.in';
      password = 'counsellor123';
    } else if (role === 'admin') {
      email = 'admin@mindbridge.edu';
      password = 'admin123';
    }
    return login(email, password);
  };

  const updateUser = async (profileData) => {
    const updated = await api.updateProfile(profileData);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        demoLogin,
        updateUser,
        isAuthenticated: !!user,
        isStudent: user?.role === 'student',
        isCounsellor: user?.role === 'counsellor',
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
