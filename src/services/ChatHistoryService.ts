/**
 * Enhanced Chat History Service
 * Provides robust chat history management with persistence verification
 */

import axios from 'axios';

// Create API client instance (similar to what's in api.ts)
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface MessageHistory {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  sessionId: string;
  messageType?: 'USER' | 'ASSISTANT';
  metadata?: Record<string, any>;
}

export interface ChatHistoryResponse {
  messages: MessageHistory[];
  totalCount: number;
  hasMore: boolean;
}

export interface MessagePersistenceDebug {
  messagesInDatabase: number;
  sessionExists: boolean;
  messages: Array<{
    id: string;
    content: string;
    messageType: string;
    createdAt: string;
  }>;
}

export class ChatHistoryService {
  private static instance: ChatHistoryService;
  private messageCache = new Map<string, MessageHistory[]>();
  private persistenceVerificationEnabled = true;

  public static getInstance(): ChatHistoryService {
    if (!ChatHistoryService.instance) {
      ChatHistoryService.instance = new ChatHistoryService();
    }
    return ChatHistoryService.instance;
  }

  /**
   * Fetch chat history for a session with optional pagination
   */
  async fetchChatHistory(sessionId: string, limit?: number, offset?: number): Promise<ChatHistoryResponse> {
    try {
      console.log(`🔍 Fetching chat history for session: ${sessionId}`);
      
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      
      const response = await apiClient.get(`/messages/session/${sessionId}?${params.toString()}`);
      
      const messages: MessageHistory[] = response.data.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.messageType === 'USER' ? 'user' : 'assistant',
        timestamp: new Date(msg.createdAt),
        sessionId: msg.sessionId,
        messageType: msg.messageType,
        metadata: msg.metadata
      }));

      // Update cache
      this.messageCache.set(sessionId, messages);

      console.log(`✅ Loaded ${messages.length} messages for session: ${sessionId}`);
      
      return {
        messages,
        totalCount: messages.length,
        hasMore: false // Would be determined by backend in real pagination
      };

    } catch (error) {
      console.error(`❌ Error fetching chat history for session ${sessionId}:`, error);
      
      // Return cached messages if available
      const cachedMessages = this.messageCache.get(sessionId) || [];
      return {
        messages: cachedMessages,
        totalCount: cachedMessages.length,
        hasMore: false
      };
    }
  }

  /**
   * Add a message to local cache and optionally verify persistence
   */
  async addMessage(message: MessageHistory, verifyPersistence = true): Promise<void> {
    const sessionMessages = this.messageCache.get(message.sessionId) || [];
    sessionMessages.push(message);
    this.messageCache.set(message.sessionId, sessionMessages);

    if (verifyPersistence && this.persistenceVerificationEnabled) {
      await this.verifyMessagePersistence(message.sessionId, message.id);
    }
  }

  /**
   * Verify that a message was properly persisted to the database
   */
  async verifyMessagePersistence(sessionId: string, messageId?: string): Promise<boolean> {
    try {
      const debugInfo = await this.getMessagePersistenceDebug(sessionId);
      
      if (messageId) {
        const messageExists = debugInfo.messages.some(msg => msg.id === messageId);
        if (!messageExists) {
          console.warn(`⚠️ Message ${messageId} not found in database for session ${sessionId}`);
          return false;
        }
      }

      console.log(`✅ Message persistence verified for session ${sessionId}: ${debugInfo.messagesInDatabase} messages`);
      return true;

    } catch (error) {
      console.error(`❌ Could not verify message persistence for session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Get detailed debugging information about message persistence
   */
  async getMessagePersistenceDebug(sessionId: string): Promise<MessagePersistenceDebug> {
    try {
      const response = await apiClient.get(`/messages/debug/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error getting persistence debug info for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Clear chat history for a session (both cache and database)
   */
  async clearChatHistory(sessionId: string): Promise<void> {
    try {
      await apiClient.delete(`/messages/session/${sessionId}`);
      this.messageCache.delete(sessionId);
      console.log(`🗑️ Cleared chat history for session: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error clearing chat history for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get cached messages for a session (for immediate UI updates)
   */
  getCachedMessages(sessionId: string): MessageHistory[] {
    return this.messageCache.get(sessionId) || [];
  }

  /**
   * Update a message in the cache
   */
  updateMessage(sessionId: string, messageId: string, updates: Partial<MessageHistory>): void {
    const messages = this.messageCache.get(sessionId);
    if (messages) {
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        messages[messageIndex] = { ...messages[messageIndex], ...updates };
        this.messageCache.set(sessionId, messages);
      }
    }
  }

  /**
   * Get message statistics for debugging
   */
  getMessageStats(sessionId: string): { cached: number; estimated: number } {
    const cached = this.messageCache.get(sessionId)?.length || 0;
    return {
      cached,
      estimated: cached // Would be different if we had server-side count
    };
  }

  /**
   * Enable/disable automatic persistence verification
   */
  setPersistenceVerification(enabled: boolean): void {
    this.persistenceVerificationEnabled = enabled;
    console.log(`🔧 Persistence verification ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Refresh chat history from server (bypass cache)
   */
  async refreshChatHistory(sessionId: string): Promise<MessageHistory[]> {
    this.messageCache.delete(sessionId);
    const response = await this.fetchChatHistory(sessionId);
    return response.messages;
  }

  /**
   * Export chat history for debugging or backup
   */
  exportChatHistory(sessionId: string): string {
    const messages = this.messageCache.get(sessionId) || [];
    return JSON.stringify({
      sessionId,
      exportDate: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp.toISOString(),
        messageType: msg.messageType
      }))
    }, null, 2);
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): { sessionsInCache: number; totalMessages: number } {
    let totalMessages = 0;
    for (const messages of this.messageCache.values()) {
      totalMessages += messages.length;
    }
    
    return {
      sessionsInCache: this.messageCache.size,
      totalMessages
    };
  }
}

// Export singleton instance
export const chatHistoryService = ChatHistoryService.getInstance();