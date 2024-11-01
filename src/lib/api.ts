import axios, { AxiosError } from 'axios';

// Constants
const API_BASE_URL = 'https://api.flomadtravel.com';
const TOKEN_KEY = 'token';

// Types
export interface ChatResponse {
  content: string;
}

export interface AIMessageDTO {
  message: string;
  sessionId: string;
}

export interface SessionDTO {
  sessionId: string;
  title: string;
  userId: string;
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
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// Token management
export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// Guest token creation
export const createGuestToken = async (): Promise<void> => {
  try {
    const response = await apiClient.post<GuestTokenResponse>('/api/auth/guest-token');
    if (response.data.token) {
      setToken(response.data.token);
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


//Message Handling
/*
 * Updated Error Handling in `sendMessage`:
 *
 * - Imported `AxiosError` from Axios to enable specific handling of Axios-related errors.
 * - Implemented type guard `axios.isAxiosError(error)` to ensure TypeScript identifies `error` as an Axios error. This allows access to `error.response?.status`.
 * - Added conditional handling for a `403` error status in `sendMessage`:
 *      - When the backend returns a 403 status code (indicating the guest message limit is reached), an alert notifies the user about the limit and suggests creating an account.
 * - Re-throws the error at the end of the catch block to allow for further handling by other components if necessary.
 */
export const sendMessage = async (
  message: string,
  sessionId: string
): Promise<ChatResponse> => {
  try {
    const payload: AIMessageDTO = {
      message,
      sessionId
    };

    console.log('Sending message:', payload);
    
    const response = await apiClient.post<string>('/api/chat/call', payload);
    console.log('Message sent successfully:', response.data);
    
    return { content: response.data };
  } catch (error) {
    // Check if the error response has a 403 status
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      alert("You've reached the message limit for guest users. Please create an account to continue.")
    } else {
      console.error('Error sending message:', error);
    }
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