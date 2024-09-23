import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext<{
  isAuthenticated: boolean;
  signIn: (token: string) => void;
  signOut: () => void;
}>({
  isAuthenticated: false,
  signIn: () => {},
  signOut: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const signIn = (token: string) => {
    setIsAuthenticated(true);
    localStorage.setItem('token', token);
  };

  const signOut = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    router.push('/signin');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);