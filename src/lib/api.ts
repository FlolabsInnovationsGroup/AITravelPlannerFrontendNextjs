import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.flomadtravel.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// apiClient.interceptors.request.use(
//   (config) => {
//     if (typeof window !== 'undefined') {
//       const token = localStorage.getItem('token');
//       if (token) {
//         if (
//           !config.url?.includes('/auth/signup') && 
//           !config.url?.includes('/auth/login') &&
//           !config.url?.includes('/learn-more')
//         ) {
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//       }
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401 && typeof window !== 'undefined') {
//       // Handle unauthorized access
//       console.error('Unauthorized, redirecting to login...');
//       // Use Next.js router for redirection in components
//     }
//     return Promise.reject(error);
//   }
// );

apiClient.interceptors.request.use(function (config) {
  // Ensure the URL is using HTTPS
  if (config.url && config.url.startsWith('http://')) {
    config.url = config.url.replace('http://', 'https://')
  }
  return config;
}, function (error) {
  return Promise.reject(error);
});

// Add a response interceptor
apiClient.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  if (error.message === 'Network Error') {
    console.error('Network error occurred. Please check your internet connection and try again.')
  }
  return Promise.reject(error);
});

export const createSession = async (name: string) => {
  const response = await apiClient.post('/sessions', { name });
  return response.data;
};

export const sendChat = async (message: string, sessionId: string) => {
  const response = await apiClient.post('/api/chat/call', { message, sessionId });
  return response.data;
};

export const getChatHistory = async (sessionId: string) => {
  const response = await apiClient.get(`/messages/session/${sessionId}`);
  return response.data;
};

export const getSessionList = async () => {
  const response = await apiClient.get('/sessions');
  return response.data;
};

export const deleteSession = async (sessionId: string) => {
  await apiClient.delete(`/sessions/${sessionId}`);
};

export const updateSession = async (sessionId: string, title: string) => {
  const response = await apiClient.put(`/sessions/${sessionId}`, { title });
  return response.data;
};

export const login = async (credentials: { username: string; password: string }) => {
  const response = await apiClient.post('/auth/login', credentials);
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const signup = async (userData: { username: string; email: string; password: string }) => {
  const response = await apiClient.post('/auth/signup', userData);
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const textToSpeech = async (text: string) => {
  const response = await apiClient.post('/tts', { text }, { responseType: 'blob' });
  return response.data;
};

export const speechToText = async (audioBlob: Blob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob);
  const response = await apiClient.post('/stt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const oauthLogin = (provider: string) => {
  if (typeof window !== 'undefined') {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`;
  }
};