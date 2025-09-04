import axios from 'axios';

// Constants
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
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
  sessionId: string;
  title: string;
  userId: string;
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

// API client setup
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get a new guest token
        const response = await axios.post(`${API_BASE_URL}/api/auth/guest-token`);
        const newToken = response.data.token;
        
        // Save the new token
        localStorage.setItem(TOKEN_KEY, newToken);
        
        // Update the failed request's token and retry
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear token and let user try again
        localStorage.removeItem(TOKEN_KEY);
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Original request interceptor
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      clearToken();
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

// Token management
export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// Guest token creation
export const createGuestToken = async (): Promise<string> => {
  try {
    const response = await apiClient.post<GuestTokenResponse>('/api/auth/guest-token');
    if (response.data.token) {
      setToken(response.data.token); // Save token to local storage
      return response.data.token;   // Return the token
    } else {
      throw new Error('Guest token missing in response');
    }
  } catch (error) {
    console.error('Error creating guest token:', error);
    throw error;
  }
};


// User management
export const getCurrentUser = async (): Promise<{ id: string }> => {
  try {
    const response = await apiClient.get<{ id: string }>('/users/current');
    return response.data;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

// Session handling
export const createSession = async (title: string): Promise<SessionDTO> => {
  try {
    const user = await getCurrentUser();

    const payload = {
      title,
      userId: user.id
    };

    const response = await apiClient.post<SessionDTO>('/sessions', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error);
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

    console.log("Sending message payload:", formData);
    const response = await apiClient.post('/api/chat/call', formData, config);
    return { content: response.data };
  } catch (error) {
    console.error('Error sending message:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("Backend response error:", error.response.data);
    }
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
  } catch (error) {
    console.error("❌ Error sending message entity:", error);
    throw error;
  }
};









export const signIn = async (username: string, password: string) => {
  const response = await apiClient.post('/api/auth/signin', { username, password });
  return response.data;
};

export const signUp = async (username: string, email: string, password: string) => {
  return await apiClient.post('/api/auth/signup', { username, email, password });
};

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
    console.log('API Response:', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Error getting chat history:', error);
    throw error;
  }
};

// Separate function for getting user sessions
export const getUserSessions = async (userId: string) => {
  try {
    const response = await apiClient.get(`/sessions/user-sessions?userId=${userId}`);
    return response.data;
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
    console.log('🔍 Fetching locations for session:', sessionId);
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
    let locations = Array.isArray(response.data) ? response.data : [];
    
    // Log when no locations are found
    if (locations.length === 0) {
      console.log('� No locations found for this session yet');
    }

    console.log(`✅ Retrieved ${locations.length} locations:`, locations);
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

// Update or add this function
export const updateSession = async (sessionId: string, title: string, userId: string) => {
  try {
    const now = new Date().toISOString();
    const payload = {
      sessionId: sessionId,
      userId: userId,
      title: title,
      createdAt: now,  // You might want to keep the original createdAt if available
      updatedAt: now
    };

    console.log('Updating session with payload:', payload);
    const response = await apiClient.put(`/sessions/${sessionId}`, payload);
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
