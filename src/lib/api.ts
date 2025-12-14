import axios from 'axios';
import { SafeStorage } from '@/utils/SafeStorage';

// Extend Window interface for custom properties
declare global {
  interface Window {
    __BACKEND_HEALTH_CHECKED?: boolean;
  }
}

// Constants
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://api.flomadtravel.com' : 'http://localhost:8080');
const TOKEN_KEY = 'token';

// Types
export interface ChatResponse {
  content: string;
}

export interface AIMessageDTO {
  message: string;
  sessionId: string;
}

export interface AIMessageResponse {
  message: string;
  suggestions: string[];
}

export interface SessionDTO {
  id?: string;
  sessionId?: string;
  title?: string;
  userId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Location {
  id: string;
  sessionId: string;
  latitude: number;
  longitude: number;
  name?: string;
  type?: string;
}

interface GuestTokenResponse {
  token: string;
}

// ==================== TOKEN MANAGEMENT FUNCTIONS ====================
// Token validation helper
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true; // Treat invalid tokens as expired
  }
};

// Token management
// 🔒 FIX 5.1: Use SafeStorage wrapper for quota error handling
export const setToken = (token: string): void => {
  const success = SafeStorage.setItem(TOKEN_KEY, token);
  if (!success) {
    console.error('⚠️ Failed to save token - localStorage quota may be exceeded');
  }
};

export const clearToken = () => {
  SafeStorage.removeItem(TOKEN_KEY);
};

export const getToken = () => {
  if (typeof window !== 'undefined') {
    const token = SafeStorage.getItem(TOKEN_KEY);
    // Check if token exists and is not expired
    if (token && isTokenExpired(token)) {
      
      clearToken();
      return null;
    }
    return token;
  }
  return null;
};

// 🔒 FIX 1.3: Client-side rate limiting for guest token creation
const GUEST_TOKEN_RATE_LIMIT = 5; // Max 5 tokens per time window
const GUEST_TOKEN_WINDOW_MS = 60000; // 1 minute window
const GUEST_TOKEN_STORAGE_KEY = 'guest_token_attempts';

interface TokenAttempt {
  timestamp: number;
  count: number;
}

const checkGuestTokenRateLimit = (): boolean => {
  try {
    const storedData = SafeStorage.getItem(GUEST_TOKEN_STORAGE_KEY);
    const now = Date.now();
    
    if (!storedData) {
      // First attempt
      SafeStorage.setItem(GUEST_TOKEN_STORAGE_KEY, JSON.stringify({
        timestamp: now,
        count: 1
      }));
      return true;
    }
    
    const attempts: TokenAttempt = JSON.parse(storedData);
    const timeSinceFirst = now - attempts.timestamp;
    
    if (timeSinceFirst > GUEST_TOKEN_WINDOW_MS) {
      // Window expired, reset
      SafeStorage.setItem(GUEST_TOKEN_STORAGE_KEY, JSON.stringify({
        timestamp: now,
        count: 1
      }));
      return true;
    }
    
    if (attempts.count >= GUEST_TOKEN_RATE_LIMIT) {
      console.error(`🔴 Rate limit exceeded: ${attempts.count} attempts in ${Math.floor(timeSinceFirst / 1000)}s`);
      return false;
    }
    
    // Increment count
    SafeStorage.setItem(GUEST_TOKEN_STORAGE_KEY, JSON.stringify({
      timestamp: attempts.timestamp,
      count: attempts.count + 1
    }));
    return true;
    
  } catch (error) {
    // If localStorage fails, allow the request (fail open)
    console.warn('Rate limit check failed:', error);
    return true;
  }
};

// Guest token creation - use direct axios without interceptors to avoid circular calls
export const createGuestToken = async (): Promise<string> => {
  try {
    // 🔒 FIX 1.3: Check rate limit before making request
    if (!checkGuestTokenRateLimit()) {
      throw new Error('Rate limit exceeded: Too many guest token requests. Please wait a moment and try again.');
    }
    
    console.log('Creating guest token...');
    
    // Use direct axios without interceptors to prevent circular dependencies
    const response = await axios.post<GuestTokenResponse>(
      `${API_BASE_URL}/api/auth/guest-token`,
      {},
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: false, // Don't need cookies for JWT
        timeout: 10000 // 🔒 FIX 1.4: Add timeout
      }
    );
    
    console.log('Guest token response:', response.data);
    
    if (response.status === 200 && response.data.token) {
      const { token } = response.data;
      setToken(token);
      console.log('Guest token created successfully');
      return token;
    }
    
    throw new Error('Failed to get guest token: No token in response');
  } catch (error: any) {
    console.error('Error creating guest token:', error.response?.data || error.message);
    throw error;
  }
};
// ==================== END TOKEN MANAGEMENT FUNCTIONS ====================

// Backend health check utility
let lastHealthCheck: { timestamp: number; isHealthy: boolean } | null = null;
const HEALTH_CHECK_CACHE_MS = 30000; // Cache health status for 30 seconds

export const checkBackendHealth = async (): Promise<boolean> => {
  // Return cached result if recent
  if (lastHealthCheck && Date.now() - lastHealthCheck.timestamp < HEALTH_CHECK_CACHE_MS) {
    return lastHealthCheck.isHealthy;
  }
  
  try {
    // Quick health check with short timeout
    const response = await axios.get(`${API_BASE_URL}/actuator/health`, {
      timeout: 3000,
      validateStatus: (status) => status === 200
    });
    
    const isHealthy = response.data?.status === 'UP';
    lastHealthCheck = { timestamp: Date.now(), isHealthy };
    
    if (!isHealthy) {
      console.warn('⚠️ Backend health check: Server reported unhealthy status');
    }
    
    return isHealthy;
  } catch (error) {
    console.error('❌ Backend health check failed - server may be down:', error);
    lastHealthCheck = { timestamp: Date.now(), isHealthy: false };
    return false;
  }
};

// Log backend availability on app start (only once)
if (typeof window !== 'undefined' && !window.__BACKEND_HEALTH_CHECKED) {
  window.__BACKEND_HEALTH_CHECKED = true;
  checkBackendHealth().then(isHealthy => {
    if (isHealthy) {
      console.log('✅ Backend server is reachable at', API_BASE_URL);
    } else {
      console.error('❌ Backend server is NOT reachable at', API_BASE_URL);
      console.error('🔧 Please ensure the Spring Boot backend is running on port 8080');
    }
  });
}

// API client setup
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds timeout for AI responses
});

// Add token to all requests
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    // 🔒 FIX 1.4: Proactive token validation - check expiration before sending request
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - currentTime;
      
      // If token expires in less than 5 minutes, it's too risky to use
      if (timeUntilExpiry < 300) {
        console.warn(`⚠️ Token expiring soon (${timeUntilExpiry}s remaining), clearing it`);
        clearToken();
        // Let the response interceptor handle refresh
        return config;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      clearToken();
      return config;
    }
    
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔒 FIX 1.2: Circuit breaker for token refresh to prevent infinite loops
let tokenRefreshInProgress = false;
let tokenRefreshFailures = 0;
const MAX_REFRESH_FAILURES = 3;
const REFRESH_FAILURE_RESET_TIME = 60000; // Reset after 1 minute

// Reset failure count after timeout
const resetRefreshFailures = () => {
  setTimeout(() => {
    if (tokenRefreshFailures > 0) {
      console.log('🔄 Resetting token refresh failure count');
      tokenRefreshFailures = 0;
    }
  }, REFRESH_FAILURE_RESET_TIME);
};

// Add response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 🔒 FIX 1.2: Circuit breaker - stop retrying if too many failures
    if (tokenRefreshFailures >= MAX_REFRESH_FAILURES) {
      console.error('🔴 Circuit breaker OPEN: Too many token refresh failures, stopping retries');
      clearToken();
      return Promise.reject(new Error('Authentication circuit breaker open - too many failures'));
    }
    
    // If the error is 401 and we haven't already tried to refresh, and it's not an auth endpoint
    if (error.response?.status === 401 && 
        !originalRequest.isRetry && 
        !originalRequest.url?.includes('/api/auth/')) { // 🔒 FIX: Exclude ALL auth endpoints
      
      // 🔒 FIX 1.2: Prevent concurrent refresh attempts
      if (tokenRefreshInProgress) {
        console.log('⏳ Token refresh already in progress, waiting...');
        // Wait for ongoing refresh to complete (max 5 seconds)
        const startWait = Date.now();
        while (tokenRefreshInProgress && (Date.now() - startWait) < 5000) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Retry with potentially new token
        const newToken = getToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return await apiClient(originalRequest);
        }
      }
      
      originalRequest.isRetry = true;
      tokenRefreshInProgress = true;
      
      try {
        console.log('🔄 Attempting token refresh...');
        
        // Get a new guest token directly via axios (no interceptors)
        const response = await axios.post(`${API_BASE_URL}/api/auth/guest-token`, {}, {
          timeout: 10000 // 🔒 FIX: Add timeout to prevent hanging
        });
        
        // Check if we got a valid token in the response
        if (response.status === 200 && response.data.token) {
          const newToken = response.data.token;

          // Save the new token
          setToken(newToken);
          tokenRefreshFailures = 0; // Reset failure count on success
          tokenRefreshInProgress = false;
          
          console.log('✅ Token refresh successful');
          
          // Update the failed request's token and retry
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return await apiClient(originalRequest);
        } 
          throw new Error('No valid token received in refresh response');
        
      } catch (refreshError) {
        tokenRefreshInProgress = false;
        tokenRefreshFailures++;
        
        console.error(`❌ Token refresh failed (attempt ${tokenRefreshFailures}/${MAX_REFRESH_FAILURES}):`, refreshError);
        
        // If refresh fails, clear token but don't reload to avoid infinite loops
        if (tokenRefreshFailures >= MAX_REFRESH_FAILURES) {
          console.error('🔴 Max refresh failures reached, clearing token');
          clearToken();
          resetRefreshFailures(); // Schedule reset
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Force clear all authentication data and create fresh session
export const initializeFreshSession = async (): Promise<string> => {

  // Clear all possible token storage
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('sessionId');
  localStorage.removeItem('user');
  
  // Clear any cached authentication data
  localStorage.clear();
  
  try {
    // Create new guest token
    const newToken = await createGuestToken();
    
    return newToken;
  } catch (error) {
    console.error('Failed to initialize fresh session:', error);
    throw error;
  }
};

// User management
export const getCurrentUser = async (): Promise<{ id: string; username?: string; email?: string }> => {
  try {
    const response = await apiClient.get<{ 
      id: string; 
      username?: string; 
      email?: string; 
      isEmailVerified?: boolean;
      provider?: string;
      roles?: string[];
      lastActive?: string;
    }>('/users/current');
    
    return response.data;
  } catch (error: any) {
    // ✅ FIX: Handle 404 gracefully - user might not exist yet for guest tokens
    if (error.response?.status === 404) {
      console.warn('User not found (404) - this is normal for new guest users');
      // Return null to indicate no user found
      throw new Error('USER_NOT_FOUND');
    }
    
    console.error('Error getting current user:', error);
    if (error.response) {
      // Response error handled
    } else if (error.request) {
      // Network error - no response received
    } else {
      // Request setup error
    }
    throw error;
  }
};

// Session handling
export const createSession = async (title: string = 'New Chat'): Promise<SessionDTO> => {
  try {
    console.log('Creating session with title:', title);
    
    // Get current user to extract userId
    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      userId = user.id;
      console.log('User ID from getCurrentUser:', userId);
    } catch (userError: any) {
      // ✅ FIX: Allow session creation even if user doesn't exist (guest users)
      if (userError.message === 'USER_NOT_FOUND') {
        console.log('User not found - creating session without userId (guest session)');
        userId = null;
      } else {
        console.warn('Could not get current user, session will be created without userId:', userError);
      }
      // Continue without userId - backend will handle it
    }

    const payload = {
      title,
      userId
    };

    console.log('Creating session with payload:', payload);
    const response = await apiClient.post<SessionDTO>('/sessions', payload);
    
    // ✅ FIX: Parse date strings from backend to Date objects
    const session = {
      ...response.data,
      createdAt: response.data.createdAt ? new Date(response.data.createdAt) : undefined,
      updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : undefined
    };
    
    console.log('Session created:', session);
    return session;
  } catch (error: any) {
    console.error('Error creating session:', error.response?.data || error.message);
    throw error;
  }
};

// Message handling
export const sendMessage = async (
  message: string,
  sessionId: string,
  audioBlob?: Blob
): Promise<ChatResponse> => {
  try {
    const formData = new FormData();

    // Add sessionId and message to FormData
    formData.append("sessionId", sessionId);
    formData.append("message", message);

    // If there’s an audio blob, add it to the form data as well
    if (audioBlob) {
      formData.append("file", audioBlob);
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    const response = await apiClient.post('/api/chat/call', formData, config);
    return { content: response.data };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// New method: Send message with entity processing
export const sendMessagesEntity = async (
  message: string,
  sessionId: string,
  audioBlob?: Blob
): Promise<AIMessageResponse> => {
  try {
    const formData = new FormData();

    // ✅ Send `sessionId` and `message` as separate fields
    formData.append("sessionId", sessionId);
    formData.append("message", message); // Ensure it's a string, NOT a JSON object

    // ✅ Append audio file if exists
    if (audioBlob) {
      formData.append("file", audioBlob, "audio.wav"); // Ensure backend expects "file"
    }

    // ✅ Get authentication token
    const authToken = getToken();

    // ✅ Send request
    const response = await apiClient.post<AIMessageResponse>(
      "/api/chat/call/entity",
      formData,
      {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error sending message:", error.message || error);
    throw error;
  }
};

export const signIn = async (username: string, password: string) => {
  console.log('API: Making signIn request to /api/auth/signin');
  try {
    const response = await apiClient.post('/api/auth/signin', { username, password }, {
      withCredentials: true // Important: This ensures cookies are sent and received
    });
    console.log('API: SignIn response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: SignIn error:', error);
    throw error;
  }
};

export const signUp = async (username: string, email: string, password: string) => apiClient.post('/api/auth/signup', { username, email, password });

// Streaming message handling
export const sendStreamMessage = async (
  message: string,
  sessionId: string
): Promise<ReadableStream<string>> => {
  try {
    const payload: AIMessageDTO = {
      message,
      sessionId
    };

    const response = await apiClient.post('/api/chat/stream', payload, {
      responseType: 'stream'
    });

    return response.data;
  } catch (error) {
    console.error('Error sending stream message:', error);
    throw error;
  }
};

// Initialize guest user
export const initializeGuestUser = async (): Promise<void> => {
  if (!getToken()) {
    await createGuestToken();
  }
};

export const getChatHistory = async (path: string) => {
  try {
    const response = await apiClient.get(`/sessions/${path}`);
     // Debug log
    return response.data;
  } catch (error) {
    console.error('Error getting chat history:', error);
    throw error;
  }
};

// 🔒 FIX 3.2: Add pagination to prevent fetching 10,000+ sessions at once
export const getUserSessions = async (
  userId: string, 
  options?: { limit?: number; offset?: number; sortBy?: string; order?: 'asc' | 'desc' }
): Promise<SessionDTO[]> => {
  try {
    const { limit = 100, offset = 0, sortBy = 'updatedAt', order = 'desc' } = options || {};
    
    const params = new URLSearchParams({
      userId,
      limit: limit.toString(),
      offset: offset.toString(),
      sortBy,
      order
    });
    
    const response = await apiClient.get<SessionDTO[]>(`/sessions/user-sessions?${params.toString()}`);
    
    // ✅ FIX: Parse date strings OR arrays from backend to Date objects
    const sessions = response.data.map((session: any) => {
      // Handle both array format [2025, 12, 7, 14, 23, 54, 687000000] and ISO string format
      const parseDate = (dateValue: any): Date | undefined => {
        if (!dateValue) return undefined;
        
        // If it's an array (Java LocalDateTime format), convert to Date
        if (Array.isArray(dateValue)) {
          const [year, month, day, hour, minute, second, nano] = dateValue;
          return new Date(year, month - 1, day, hour, minute, second, Math.floor(nano / 1000000));
        }
        
        // If it's a string, parse as ISO date
        if (typeof dateValue === 'string') {
          return new Date(dateValue);
        }
        
        return undefined;
      };
      
      return {
        ...session,
        createdAt: parseDate(session.createdAt),
        updatedAt: parseDate(session.updatedAt)
      };
    });
    
    return sessions;
  } catch (error) {
    console.error('Error getting user sessions:', error);
    throw error;
  }
};

// Separate function for getting session messages
export const getSessionMessages = async (sessionId: string) => {
  try {
    const response = await apiClient.get(`/messages/session/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting session messages:', error);
    throw error;
  }
};

// Get locations by session ID
export const getLocationsBySession = async (sessionId: string): Promise<Location[]> => {
  try {
    
    // First try to get any existing locations
    const response = await apiClient.get(`/api/locations/${sessionId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data) {
      console.warn('⚠️ No location data received from server');
      return [];
    }

    // Ensure we're getting an array
    const locations = Array.isArray(response.data) ? response.data : [];
    
    // Log when no locations are found
    if (locations.length === 0) {
      // TODO: Consider adding analytics or user feedback for empty location results
    }

    return locations;
  } catch (error: any) {
    console.error('❌ Error getting locations by session:', {
      error,
      status: error.response?.status,
      data: error.response?.data
    });
    throw new Error(error.response?.data?.message || 'Failed to fetch locations');
  }
};

// Transcribe audio file to text
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('audioFile', audioBlob, 'recording.webm');

    const response = await apiClient.post<string>('/audio/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Error transcribing audio:', error);
    throw new Error(error.response?.data?.message || 'Failed to transcribe audio');
  }
};

// Update or add this function
export const updateSession = async (sessionId: string, title: string, userId: string) => {
  try {
    const payload = {
      sessionId,
      userId,
      title,
      // ✅ FIX: Don't send createdAt - let backend preserve original timestamp
      // Only send updatedAt which backend will set automatically
      updatedAt: new Date().toISOString()
    };

    const response = await apiClient.put(`/sessions/${sessionId}`, payload);
    
    // ✅ FIX: Parse date strings from backend to Date objects
    const session = {
      ...response.data,
      createdAt: response.data.createdAt ? new Date(response.data.createdAt) : undefined,
      updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : undefined
    };
    
    return session;
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

// Generate AI-powered session title based on conversation history
export const generateSessionTitle = async (sessionId: string): Promise<string> => {
  try {
    console.log(`🤖 Generating AI title for session: ${sessionId}`);
    const response = await apiClient.post<string>(`/sessions/${sessionId}/title/generate`);
    console.log(`✅ AI-generated title: "${response.data}"`);
    return response.data;
  } catch (error) {
    console.error('Error generating session title:', error);
    throw error;
  }
};

// Delete session
export const deleteSession = async (sessionId: string) => {
  try {
    const response = await apiClient.delete(`/sessions/${sessionId}`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Session update error:', error.response?.data);
    } else {
      console.error('Session update error:', error);
    }
    throw error;
  }
};
