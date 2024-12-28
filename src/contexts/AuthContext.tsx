//src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { getToken, setToken, clearToken, getCurrentUser, createGuestToken } from '@/lib/api';

interface User {
  id: string;
  token: string; // Add token property to the User type
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null; // Ensure currentUser includes the token
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Ensure we have a token (guest or authenticated)
        if (!getToken()) {
          const guestToken = await createGuestToken(); // Explicitly get the guest token
          setToken(guestToken); // Save guest token for API requests
        }

        // Get current user info
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser({ ...user, token: getToken() || '' }); // Include token in currentUser
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearToken();
        setIsAuthenticated(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = (token: string) => {
    setToken(token); // Save token to local storage
    setIsAuthenticated(true);

    // Refresh the current user info
    getCurrentUser()
      .then((user) => {
        if (user) {
          setCurrentUser({ ...user, token });
        }
      })
      .catch((error) => console.error('Error fetching user after sign-in:', error));

    window.location.href = '/chat';
  };

  const signOut = () => {
    clearToken(); // Clear token from local storage
    setIsAuthenticated(false);
    setCurrentUser(null);
    window.location.href = '/auth/signin';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
