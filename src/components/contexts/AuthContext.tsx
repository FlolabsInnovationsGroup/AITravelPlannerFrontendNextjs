'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { getToken, setToken, clearToken, getCurrentUser, initializeGuestUser } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: { id: string } | null;
  signIn: (token: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  currentUser: null,
  signIn: () => {},
  signOut: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Ensure we have a token (guest or authenticated)
        await initializeGuestUser();
        
        // Get current user info
        const user = await getCurrentUser();
        setCurrentUser(user);
        setIsAuthenticated(!!getToken());
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearToken();
        setIsAuthenticated(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = (token: string) => {
    setToken(token);
    setIsAuthenticated(true);
    window.location.href = '/chat';
  };

  const signOut = () => {
    clearToken();
    setIsAuthenticated(false);
    setCurrentUser(null);
    window.location.href = '/signin';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);