import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    // Mock login: in a real app, this would call an API
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock user object with role based on email (for demo purposes)
    const normalizedEmail = email.toLowerCase();
    const role = normalizedEmail.includes('admin')
      ? 'ADMIN'
      : normalizedEmail.includes('owner')
        ? 'OWNER'
        : 'DRIVER';
    const mockUser = {
      id: 1,
      email: email,
      name: email.split('@')[0],
      role: role
    };
    setUser(mockUser);
    setLoading(false);
    return mockUser;
  };

  const register = async (email, password, name) => {
    // Mock registration
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock user object with role based on email (for demo purposes)
    const normalizedEmail = email.toLowerCase();
    const role = normalizedEmail.includes('admin')
      ? 'ADMIN'
      : normalizedEmail.includes('owner')
        ? 'OWNER'
        : 'DRIVER';
    const mockUser = {
      id: Date.now(),
      email: email,
      name: name,
      role: role
    };
    setUser(mockUser);
    setLoading(false);
    return mockUser;
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};