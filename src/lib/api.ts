//src/lib/api.ts
import axios from 'axios';

const API_BASE_URL ='http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const getSessionList = async () => {
  return await apiClient.get('/sessions/user-sessions');
};

export const createSession = async (title: string) => {
  return await apiClient.post('/sessions', { title });
};

export const deleteSession = async (sessionId: string) => {
  return await apiClient.delete(`/sessions/${sessionId}`);
};

export const updateSession = async (sessionId: string, title: string) => {
  return await apiClient.put(`/sessions/${sessionId}`, { title });
};

export const sendChat = async (message: string, sessionId: string) => {
  return await apiClient.post('/api/chat/call', { message, sessionId });
};

export const getChatHistory = async (sessionId: string) => {
  return await apiClient.get(`/messages/session/${sessionId}`);
};


export const storeChat = async (sessionId: string, content: string, messageType: string) => {
  return await apiClient.post('/messages', { sessionId, content, messageType });
};

export const sendMessageToBackend = async (message: string) => {
  return await apiClient.post('/api/chatbot/message', { text: message });
};

export const signIn = async (username: string, password: string) => {
  const response = await apiClient.post('/api/auth/login', { username, password });
  return response.data;
};

export const signUp = async (username: string, email: string, password: string) => {
  return await apiClient.post('/api/auth/signup', { username, email, password });
};



export default apiClient;