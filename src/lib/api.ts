import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.flomadtravel.com';
//const API_BASE_URL = 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        if (
          !config.url?.includes('/auth/signup') && 
          !config.url?.includes('/auth/login') &&
          !config.url?.includes('/learn-more')
        ) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Response Interceptor
// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       console.error('Unauthorized, redirecting to login...');
//       // Use Next.js router to redirect in components
//     }
//     return Promise.reject(error);
//   }
// );

export const signUp = async (username: string, email: string, password: string) => {
  return await apiClient.post('/api/auth/signup', { username, email, password });
};

export const signIn = async (username: string, password: string) => {
  const response = await apiClient.post('/api/auth/login', { username, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response;
};

export const getSessionList = async () => {
  return await apiClient.get('/api/sessions/user-sessions');
};

export const createSession = async (title: string) => {
  return await apiClient.post('/api/sessions', { title });
};

export const deleteSession = async (sessionId: string) => {
  return await apiClient.delete(`/api/sessions/${sessionId}`);
};

export const updateSession = async (sessionId: string, title: string) => {
  return await apiClient.put(`/api/sessions/${sessionId}`, { title });
};

export const sendChat = async (message: string, sessionId: string) => {
  return await apiClient.post('/api/chat/call', { message, sessionId });
};

export const getChatHistory = async (sessionId: string) => {
  return await apiClient.get(`/api/messages/session/${sessionId}`);
};


export default apiClient;