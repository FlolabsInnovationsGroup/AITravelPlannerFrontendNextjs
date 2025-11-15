import { Message } from '@/types/chat';

export interface ChatSession {
  sessionId: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
  isOffline?: boolean;
}

export interface OfflineMessage extends Message {
  isOffline: true;
  retryCount: number;
  maxRetries: number;
}

/**
 * Enhanced chat persistence service with offline support and robust error handling
 */
export class EnhancedChatPersistence {
  private static readonly STORAGE_KEYS = {
    SESSIONS: 'ai_travel_chat_sessions',
    CURRENT_SESSION: 'ai_travel_current_session',
    OFFLINE_QUEUE: 'ai_travel_offline_queue',
    USER_PREFERENCES: 'ai_travel_chat_preferences'
  };

  private static readonly MAX_SESSIONS = 50;
  private static readonly MAX_MESSAGES_PER_SESSION = 500;
  private static readonly CLEANUP_THRESHOLD_DAYS = 30;

  // Session Management
  static saveChatSession(session: ChatSession): void {
    try {
      const sessions = this.getAllSessions();
      const existingIndex = sessions.findIndex(s => s.sessionId === session.sessionId);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = { ...session, lastUpdated: new Date() };
      } else {
        sessions.push({ ...session, lastUpdated: new Date() });
      }

      // Cleanup old sessions if needed
      const cleanedSessions = this.cleanupOldSessions(sessions);
      
      localStorage.setItem(this.STORAGE_KEYS.SESSIONS, JSON.stringify(cleanedSessions));
    } catch (error) {
      this.logError('Failed to save chat session', error);
    }
  }

  static getChatSession(sessionId: string): ChatSession | null {
    try {
      const sessions = this.getAllSessions();
      return sessions.find(s => s.sessionId === sessionId) || null;
    } catch (error) {
      this.logError('Failed to get chat session', error);
      return null;
    }
  }

  static getAllSessions(): ChatSession[] {
    try {
      const sessionsJson = localStorage.getItem(this.STORAGE_KEYS.SESSIONS);
      if (!sessionsJson) return [];
      
      return JSON.parse(sessionsJson).map((session: any) => ({
        ...session,
        lastUpdated: new Date(session.lastUpdated),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }))
      }));
    } catch (error) {
      this.logError('Failed to get all sessions', error);
      return [];
    }
  }

  static deleteSession(sessionId: string): boolean {
    try {
      const sessions = this.getAllSessions();
      const filteredSessions = sessions.filter(s => s.sessionId !== sessionId);
      
      localStorage.setItem(this.STORAGE_KEYS.SESSIONS, JSON.stringify(filteredSessions));
      
      // Clear current session if it was deleted
      const currentSession = this.getCurrentSession();
      if (currentSession?.sessionId === sessionId) {
        this.clearCurrentSession();
      }
      
      return true;
    } catch (error) {
      this.logError('Failed to delete session', error);
      return false;
    }
  }

  // Message Management
  static addMessageToSession(sessionId: string, message: Message): void {
    try {
      const session = this.getChatSession(sessionId);
      if (session) {
        session.messages.push(message);
        
        // Limit messages per session
        if (session.messages.length > this.MAX_MESSAGES_PER_SESSION) {
          session.messages = session.messages.slice(-this.MAX_MESSAGES_PER_SESSION);
        }
        
        this.saveChatSession(session);
      }
    } catch (error) {
      this.logError('Failed to add message to session', error);
    }
  }

  static updateMessageInSession(sessionId: string, messageId: number, updates: Partial<Message>): void {
    try {
      const session = this.getChatSession(sessionId);
      if (session) {
        const messageIndex = session.messages.findIndex(m => m.id === messageId);
        if (messageIndex >= 0) {
          session.messages[messageIndex] = { ...session.messages[messageIndex], ...updates };
          this.saveChatSession(session);
        }
      }
    } catch (error) {
      this.logError('Failed to update message in session', error);
    }
  }

  // Current Session Management
  static setCurrentSession(sessionId: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_SESSION, sessionId);
    } catch (error) {
      this.logError('Failed to set current session', error);
    }
  }

  static getCurrentSession(): ChatSession | null {
    try {
      const sessionId = localStorage.getItem(this.STORAGE_KEYS.CURRENT_SESSION);
      return sessionId ? this.getChatSession(sessionId) : null;
    } catch (error) {
      this.logError('Failed to get current session', error);
      return null;
    }
  }

  static clearCurrentSession(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.CURRENT_SESSION);
    } catch (error) {
      this.logError('Failed to clear current session', error);
    }
  }

  // Offline Support
  static addToOfflineQueue(message: OfflineMessage): void {
    try {
      const queue = this.getOfflineQueue();
      queue.push(message);
      localStorage.setItem(this.STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (error) {
      this.logError('Failed to add to offline queue', error);
    }
  }

  static getOfflineQueue(): OfflineMessage[] {
    try {
      const queueJson = localStorage.getItem(this.STORAGE_KEYS.OFFLINE_QUEUE);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      this.logError('Failed to get offline queue', error);
      return [];
    }
  }

  static removeFromOfflineQueue(messageId: number): void {
    try {
      const queue = this.getOfflineQueue();
      const filteredQueue = queue.filter(msg => msg.id !== messageId);
      localStorage.setItem(this.STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(filteredQueue));
    } catch (error) {
      this.logError('Failed to remove from offline queue', error);
    }
  }

  static clearOfflineQueue(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.OFFLINE_QUEUE);
    } catch (error) {
      this.logError('Failed to clear offline queue', error);
    }
  }

  // Search and Filtering
  static searchMessages(query: string, sessionId?: string): { session: ChatSession; message: Message; matchIndex: number }[] {
    try {
      const sessions = sessionId ? [this.getChatSession(sessionId)].filter(Boolean) : this.getAllSessions();
      const results: { session: ChatSession; message: Message; matchIndex: number }[] = [];
      
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
      
      sessions.forEach(session => {
        session!.messages.forEach(message => {
          const content = message.content.toLowerCase();
          let matchCount = 0;
          let firstMatchIndex = -1;
          
          searchTerms.forEach(term => {
            const index = content.indexOf(term);
            if (index >= 0) {
              matchCount++;
              if (firstMatchIndex === -1) firstMatchIndex = index;
            }
          });
          
          // Require all search terms to match
          if (matchCount === searchTerms.length) {
            results.push({ session: session!, message, matchIndex: firstMatchIndex });
          }
        });
      });
      
      // Sort by relevance (more recent messages first, then by match position)
      return results.sort((a, b) => {
        const timeA = a.message.timestamp?.getTime() || 0;
        const timeB = b.message.timestamp?.getTime() || 0;
        return timeB - timeA;
      });
    } catch (error) {
      this.logError('Failed to search messages', error);
      return [];
    }
  }

  // Export/Import
  static exportChatHistory(): string {
    try {
      const sessions = this.getAllSessions();
      return JSON.stringify({
        exportDate: new Date().toISOString(),
        sessions: sessions,
        version: '1.0'
      }, null, 2);
    } catch (error) {
      this.logError('Failed to export chat history', error);
      return '';
    }
  }

  static importChatHistory(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.sessions && Array.isArray(data.sessions)) {
        localStorage.setItem(this.STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));
        return true;
      }
      return false;
    } catch (error) {
      this.logError('Failed to import chat history', error);
      return false;
    }
  }

  // Utility Methods
  private static cleanupOldSessions(sessions: ChatSession[]): ChatSession[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.CLEANUP_THRESHOLD_DAYS);
    
    let cleanedSessions = sessions.filter(session => 
      session.lastUpdated > cutoffDate || session.messages.length > 0
    );
    
    // If still too many sessions, keep only the most recent ones
    if (cleanedSessions.length > this.MAX_SESSIONS) {
      cleanedSessions = cleanedSessions
        .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
        .slice(0, this.MAX_SESSIONS);
    }
    
    return cleanedSessions;
  }

  static getStorageUsage(): { used: number; total: number; percentage: number } {
    try {
      let used = 0;
      const total = 5 * 1024 * 1024; // 5MB typical localStorage limit
      
      Object.values(this.STORAGE_KEYS).forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          used += new Blob([value]).size;
        }
      });
      
      return {
        used,
        total,
        percentage: (used / total) * 100
      };
    } catch (error) {
      this.logError('Failed to calculate storage usage', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  private static logError(message: string, error: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`EnhancedChatPersistence: ${message}`, error);
    }
    // In production, you could send to error tracking service
  }
}

export default EnhancedChatPersistence;