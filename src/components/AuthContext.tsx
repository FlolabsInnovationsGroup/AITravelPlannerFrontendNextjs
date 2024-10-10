'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  signIn: (token: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  signIn: () => {},
  signOut: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const signIn = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    window.location.href = '/chat';
  };

  const signOut = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    window.location.href = '/signin';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);