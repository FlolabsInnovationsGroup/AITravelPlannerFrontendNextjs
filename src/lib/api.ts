import axios from 'axios'


const API_BASE_URL = 'https://api.flomadtravel.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// export const sendChat = async (message: string, sessionId: string) => {
//   try {
//     const response = await api.post('/api/chat/call', { message, sessionId })
//     return response.data
//   } catch (error) {
//     console.error('Error sending chat:', error)
//     throw error
//   }
// }

export const createSession = async (name: string) => {
  try {
    const response = await api.post('/sessions', { name })
    return response.data
  } catch (error) {
    console.error('Error creating session:', error)
    throw error
  }
}

export const getSessionList = async () => {
  try {
    const response = await api.get('/sessions')
    return response.data
  } catch (error) {
    console.error('Error fetching sessions:', error)
    throw error
  }
}

export const deleteSession = async (sessionId: string) => {
  try {
    await api.delete(`/sessions/${sessionId}`)
  } catch (error) {
    console.error('Error deleting session:', error)
    throw error
  }
}

export const updateSession = async (sessionId: string, title: string) => {
  try {
    const response = await api.put(`/sessions/${sessionId}`, { title })
    return response.data
  } catch (error) {
    console.error('Error updating session:', error)
    throw error
  }
}

// export const getChatHistory = async (sessionId: string) => {
//   try {
//     const response = await api.get(`/messages/session/${sessionId}`)
//     return response.data
//   } catch (error) {
//     console.error('Error fetching chat history:', error)
//     throw error
//   }
// }

// Add a request interceptor to include the JWT token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const login = async (credentials: { username: string; password: string }) => {
  const response = await api.post('/auth/login', credentials);
  localStorage.setItem('jwt_token', response.data.token);
  return response.data;
};

export const signup = async (userData: { username: string; password: string; email: string }) => {
  const response = await api.post('/auth/signup', userData);
  localStorage.setItem('jwt_token', response.data.token);
  return response.data;
};

export const sendChat = async (message: string, sessionId: string) => {
  const response = await api.post('/chat', { message, sessionId });
  return response.data;
};

export const getChatHistory = async (sessionId: string) => {
  const response = await api.get(`/chat/history/${sessionId}`);
  return response.data;
};

export const textToSpeech = async (text: string) => {
  const response = await api.post('/tts', { text }, { responseType: 'blob' });
  return response.data;
};

export const speechToText = async (audioBlob: Blob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob);
  const response = await api.post('/stt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const oauthLogin = (provider: string) => {
  window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`;
};