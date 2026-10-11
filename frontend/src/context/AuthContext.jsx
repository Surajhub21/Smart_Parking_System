import React, { createContext, useContext, useState, useEffect } from 'react';
import http from '../services/httpClient';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

function normalizeUser(data) {
  if (!data) return null;
  const roles = Array.isArray(data.roles)
    ? data.roles
    : data.roles
      ? Array.from(data.roles)
      : [];

  const primaryRole = roles[0] || data.role || 'DRIVER';

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    roles,
    role: primaryRole,
    phone: data.phone || ''
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from Spring Security cookie on app load
  useEffect(() => {
    let isMounted = true;
    const fetchSession = async () => {
      try {
        const currentUser = await http.get('/auth/me');
        if (isMounted && currentUser) {
          setUser(normalizeUser(currentUser));
        }
      } catch (err) {
        // Not logged in or session expired — normal state
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await http.post('/auth/login', { email, password });
      const normalized = normalizeUser(response);
      setUser(normalized);
      return normalized;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name, role = 'DRIVER', phone = '') => {
    setLoading(true);
    try {
      const payload = {
        email,
        password,
        name,
        role: role.toUpperCase(),
        ...(phone ? { phone } : {})
      };
      const response = await http.post('/auth/register', payload);
      const normalized = normalizeUser(response);
      setUser(normalized);
      return normalized;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await http.post('/auth/logout');
    } catch (e) {
      console.warn('Logout request warning:', e);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};