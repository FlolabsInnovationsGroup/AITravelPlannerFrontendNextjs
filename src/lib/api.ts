import axios from 'axios'


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const sendChat = async (message: string, sessionId: string) => {
  try {
    const response = await api.post('/api/chat/call', { message, sessionId })
    return response.data
  } catch (error) {
    console.error('Error sending chat:', error)
    throw error
  }
}

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

export const getChatHistory = async (sessionId: string) => {
  try {
    const response = await api.get(`/messages/session/${sessionId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching chat history:', error)
    throw error
  }
}