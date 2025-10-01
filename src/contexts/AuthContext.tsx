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
        let token = getToken();
        
        // Always create a new guest token if we don't have one
        if (!token) {
          token = await createGuestToken();
          // Token is already saved in createGuestToken(), but ensure it's set
          setToken(token);
        }

        // Add a small delay to ensure token is properly set in localStorage
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get current user info using the token we just ensured exists
        try {
          const user = await getCurrentUser();
          if (user) {
            setCurrentUser({ ...user, token }); // Use the token we just verified/created
            setIsAuthenticated(true);
          } else {
            // If no user but we have a token, create a basic guest user
            setCurrentUser({ id: 'guest', token });
            setIsAuthenticated(true);
          }
        } catch (userError) {
          console.warn('Could not get current user, using guest session:', userError);
          // If getCurrentUser fails but we have a token, still set up guest session
          setCurrentUser({ id: 'guest', token });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // On error, clear everything and try to create a new guest session
        clearToken();
        try {
          const newToken = await createGuestToken();
          setToken(newToken);
          setCurrentUser({ id: 'guest', token: newToken });
          setIsAuthenticated(true);
        } catch (retryError) {
          console.error('Failed to create guest session:', retryError);
          setIsAuthenticated(false);
        }
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
