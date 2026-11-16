import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nittevision_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('nittevision_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error("Token verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, role, full_name, user_id } = res.data;
    localStorage.setItem('nittevision_token', access_token);
    setToken(access_token);

    // Fetch full profile
    const profileRes = await api.get('/auth/me');
    setUser(profileRes.data);
    return profileRes.data;
  };

  const register = async (studentData) => {
    const res = await api.post('/auth/register', studentData);
    const { access_token } = res.data;
    localStorage.setItem('nittevision_token', access_token);
    setToken(access_token);

    const profileRes = await api.get('/auth/me');
    setUser(profileRes.data);
    return profileRes.data;
  };

  const logout = () => {
    localStorage.removeItem('nittevision_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, role: user?.role, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
