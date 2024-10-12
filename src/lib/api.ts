import axios from 'axios';

const TOKEN_KEY = 'authToken';
const GUEST_TOKEN_KEY = 'guestToken';

export const setAuthToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(GUEST_TOKEN_KEY); // Remove guest token when setting auth token
};

export const setGuestToken = (token: string) => {
  localStorage.setItem(GUEST_TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(GUEST_TOKEN_KEY);
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(GUEST_TOKEN_KEY);
};

const API_BASE_URL = 'http://localhost:8080';

export type MessageType = {
  id: number;
  messageType: 'USER' | 'ASSISTANT';
  content: string;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in requests
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token might be expired
      clearTokens();
      // Redirect to login or handle re-authentication
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const sendMessage = async (message: string, sessionId: string | null): Promise<{
  content: string;
  sessionId: string;
  redirectTo?: string;
  guestToken?: string;
  additionalInfo?: string;
}> => {
  try {
    const response = await apiClient.post('/api/chat/call', { message, sessionId });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getSessionList = async () => {
  return await apiClient.get('/sessions/user-sessions');
};

export const createSession = async (title: string): Promise<{
  id: string;
  title: string;
  guestToken?: string;
}> => {
  try {
    const response = await apiClient.post('/sessions', { title });
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const deleteSession = async (sessionId: string) => {
  return await apiClient.delete(`/sessions/${sessionId}`);
};

export const updateSession = async (sessionId: string, title: string) => {
  return await apiClient.put(`/sessions/${sessionId}`, { title });
};

export const getChatHistory = async (sessionId: string): Promise<{
  data: MessageType[];
}> => {
  try {
    const response = await apiClient.get(`/messages/session/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

export const signIn = async (username: string, password: string) => {
  const response = await apiClient.post('/api/auth/login', { username, password });
  return response.data;
};

export const signUp = async (username: string, email: string, password: string) => {
  return await apiClient.post('/api/auth/signup', { username, email, password });
};

export default apiClient;