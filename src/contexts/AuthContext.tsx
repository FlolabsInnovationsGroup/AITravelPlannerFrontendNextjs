'use client';

import React, { createContext, useState, useContext, useEffect, useMemo, useRef } from 'react';
import { getToken, setToken, clearToken, getCurrentUser, createGuestToken, initializeFreshSession } from '@/lib/api';

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

// Circuit Breaker Pattern for Auth Failures
class AuthCircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  private readonly FAILURE_THRESHOLD = 3;
  private readonly RESET_TIMEOUT = 60000; // 1 minute
  
  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.FAILURE_THRESHOLD) {
      this.state = 'OPEN';
      console.warn('🔴 Auth circuit breaker OPEN - too many failures');
    }
  }
  
  canAttempt(): boolean {
    if (this.state === 'CLOSED') {
      return true;
    }
    
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure >= this.RESET_TIMEOUT) {
        this.state = 'HALF_OPEN';
        console.log('🟡 Auth circuit breaker HALF_OPEN - trying again');
        return true;
      }
      return false;
    }
    
    // HALF_OPEN state - allow one attempt
    return true;
  }
  
  getState(): string {
    return this.state;
  }
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
  const [isInitializing, setIsInitializing] = useState(true);
  const circuitBreaker = useRef(new AuthCircuitBreaker());

  useEffect(() => {
    const initializeAuth = async () => {
      // Check circuit breaker before attempting
      if (!circuitBreaker.current.canAttempt()) {
        console.error('🔴 Circuit breaker OPEN - skipping auth initialization');
        // Use emergency guest session
        try {
          const newToken = await createGuestToken();
          setToken(newToken);
          setCurrentUser({ id: 'guest', token: newToken });
          setIsAuthenticated(true);
          setIsInitializing(false);
        } catch {
          setIsAuthenticated(false);
          setIsInitializing(false);
        }
        return;
      }
      
      // 🔒 FIX 1.1: Remove race condition, add proper retry logic
      const maxRetries = 3;
      let retryCount = 0;
      
      setIsInitializing(true);
      
      while (retryCount < maxRetries) {
        try {
          let token = getToken(); // This will return null if token is expired
          
          // If no valid token, initialize fresh session
          if (!token) {
            console.log('🔐 No valid token found, creating guest session');
            token = await initializeFreshSession();
            
            // Verify token was actually saved
            const savedToken = getToken();
            if (!savedToken) {
              throw new Error('Token creation failed - not persisted to storage');
            }
          }

          // 🔒 FIX 1.1: Removed arbitrary 100ms delay - use proper async flow
          // Try to get current user with exponential backoff on failure
          let user = null;
          let getUserAttempts = 0;
          const maxGetUserAttempts = 2;
          
          while (getUserAttempts < maxGetUserAttempts) {
            try {
              user = await getCurrentUser();
              break; // Success - exit retry loop
            } catch (userError: any) {
              getUserAttempts++;
              if (getUserAttempts >= maxGetUserAttempts) {
                // If getCurrentUser consistently fails, treat as guest
                console.warn('Could not get current user after retries, using guest session');
                break;
              }
              // Wait with exponential backoff: 200ms, 400ms
              await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, getUserAttempts - 1)));
            }
          }
          
          if (user) {
            setCurrentUser({ ...user, token });
            setIsAuthenticated(true);
            console.log('✅ Auth initialized for user:', user.id);
            circuitBreaker.current.recordSuccess(); // Record success
          } else {
            // Guest session fallback
            setCurrentUser({ id: 'guest', token });
            setIsAuthenticated(true);
            console.log('✅ Auth initialized as guest');
            circuitBreaker.current.recordSuccess(); // Record success
          }
          
          setIsInitializing(false);
          return; // Success - exit retry loop
          
        } catch (error) {
          retryCount++;
          circuitBreaker.current.recordFailure(); // Record failure
          console.error(`❌ Auth initialization attempt ${retryCount}/${maxRetries} failed:`, error);
          
          if (retryCount >= maxRetries) {
            // Final fallback: try one last guest token creation
            console.error('🔴 All auth initialization attempts failed, final guest token attempt');
            try {
              clearToken();
              const newToken = await createGuestToken();
              setToken(newToken);
              setCurrentUser({ id: 'guest', token: newToken });
              setIsAuthenticated(true);
              console.log('✅ Emergency guest session created');
            } catch (retryError) {
              console.error('🔴 CRITICAL: Failed to create any session:', retryError);
              setIsAuthenticated(false);
            }
            setIsInitializing(false);
            return;
          }
          
          // Wait before retry with exponential backoff: 500ms, 1s, 2s
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount - 1)));
        }
      }
    };

    initializeAuth();
  }, []);

  const signIn = (token: string) => {
    // For session-based auth, we don't need to store a token
    // The JSESSIONID cookie handles authentication
    if (token === 'session-auth') {
      setIsAuthenticated(true);
      
      // Refresh the current user info
      getCurrentUser()
        .then((user) => {
          if (user) {
            setCurrentUser({ ...user, token: 'session-auth' });
          }
        })
        .catch((error) => console.error('Error fetching user after sign-in:', error));
    } else {
      // Handle token-based auth (for guest tokens, etc.)
      setToken(token);
      setIsAuthenticated(true);
      
      getCurrentUser()
        .then((user) => {
          if (user) {
            setCurrentUser({ ...user, token });
          }
        })
        .catch((error) => console.error('Error fetching user after sign-in:', error));
    }
    
    // Redirect to chat page after successful authentication
    window.location.href = '/chat';
  };

  const signOut = () => {
    clearToken(); // Clear token from local storage
    setIsAuthenticated(false);
    setCurrentUser(null);
    window.location.href = '/auth/signin';
  };

  const contextValue = useMemo(
    () => ({ isAuthenticated, currentUser, signIn, signOut }),
    [isAuthenticated, currentUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
