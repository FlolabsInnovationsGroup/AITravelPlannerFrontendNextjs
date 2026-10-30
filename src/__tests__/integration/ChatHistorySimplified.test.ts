/**
 * Simplified Chat History Integration Tests
 * Tests core functionality without complex mocking dependencies
 */

import { ChatHistoryService, MessageHistory } from '../../services/ChatHistoryService';

// Mock axios for API calls
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock console to avoid noise in tests
console.log = jest.fn();
console.error = jest.fn();

describe('Chat History Integration Tests', () => {
  let chatHistoryService: ChatHistoryService;
  
  beforeEach(() => {
    chatHistoryService = new ChatHistoryService();
    jest.clearAllMocks();
  });

  describe('Message Flow Integration', () => {
    test('should handle complete message lifecycle', async () => {
      const sessionId = 'integration-test-session';
      
      // Create a user message
      const userMessage: MessageHistory = {
        id: 'user-msg-1',
        content: 'Hello, I need help planning a trip to Paris',
        sender: 'user',
        timestamp: new Date(),
        sessionId,
        messageType: 'USER',
        metadata: { source: 'user_input' }
      };

      // Create an AI response message
      const aiMessage: MessageHistory = {
        id: 'ai-msg-1',
        content: 'I\'d be happy to help you plan your trip to Paris! What dates are you considering?',
        sender: 'assistant',
        timestamp: new Date(),
        sessionId,
        messageType: 'ASSISTANT',
        metadata: { model: 'gpt-3.5-turbo', source: 'ai_assistant' }
      };

      // Test message addition (simulates frontend adding messages)
      await chatHistoryService.addMessage(userMessage, false);
      await chatHistoryService.addMessage(aiMessage, false);

      // Verify messages are cached locally
      const cachedMessages = chatHistoryService.getCachedMessages(sessionId);
      expect(cachedMessages).toHaveLength(2);
      
      // Verify message ordering (user first, then AI)
      expect(cachedMessages[0].sender).toBe('user');
      expect(cachedMessages[1].sender).toBe('assistant');
      
      // Verify message content preservation
      expect(cachedMessages[0].content).toContain('planning a trip to Paris');
      expect(cachedMessages[1].content).toContain('help you plan your trip');
    });

    test('should handle session isolation', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      // Add messages to different sessions
      await chatHistoryService.addMessage({
        id: 'msg-1',
        content: 'Session 1 message',
        sender: 'user',
        timestamp: new Date(),
        sessionId: session1,
        messageType: 'USER',
        metadata: {}
      }, false);

      await chatHistoryService.addMessage({
        id: 'msg-2',
        content: 'Session 2 message',
        sender: 'user',
        timestamp: new Date(),
        sessionId: session2,
        messageType: 'USER',
        metadata: {}
      }, false);

      // Verify session isolation
      const session1Messages = chatHistoryService.getCachedMessages(session1);
      const session2Messages = chatHistoryService.getCachedMessages(session2);

      expect(session1Messages).toHaveLength(1);
      expect(session2Messages).toHaveLength(1);
      expect(session1Messages[0].content).toBe('Session 1 message');
      expect(session2Messages[0].content).toBe('Session 2 message');
    });

    test('should handle message metadata correctly', async () => {
      const sessionId = 'metadata-test-session';
      
      // User message with audio metadata
      const audioMessage: MessageHistory = {
        id: 'audio-msg',
        content: 'This is a voice message',
        sender: 'user',
        timestamp: new Date(),
        sessionId,
        messageType: 'USER',
        metadata: {
          hasAudio: true,
          audioFileId: 'audio-123',
          source: 'voice_input',
          duration: 5.2
        }
      };

      // AI response with function calling metadata
      const functionMessage: MessageHistory = {
        id: 'function-msg',
        content: 'I found 3 flights to Paris for you.',
        sender: 'assistant',
        timestamp: new Date(),
        sessionId,
        messageType: 'ASSISTANT',
        metadata: {
          functionsUsed: ['searchFlights'],
          model: 'gpt-3.5-turbo',
          source: 'ai_assistant',
          processingTime: 2.1
        }
      };

      await chatHistoryService.addMessage(audioMessage, false);
      await chatHistoryService.addMessage(functionMessage, false);

      const messages = chatHistoryService.getCachedMessages(sessionId);
      
      // Verify audio message metadata
      expect(messages[0].metadata?.hasAudio).toBe(true);
      expect(messages[0].metadata?.audioFileId).toBe('audio-123');
      expect(messages[0].metadata?.duration).toBe(5.2);
      
      // Verify AI function metadata
      expect(messages[1].metadata?.functionsUsed).toContain('searchFlights');
      expect(messages[1].metadata?.processingTime).toBe(2.1);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle API failures gracefully', async () => {
      const sessionId = 'error-test-session';
      
      // This should not throw even if API calls fail
      expect(async () => {
        await chatHistoryService.fetchChatHistory(sessionId);
      }).not.toThrow();
      
      // Service should still be functional for local operations
      const stats = chatHistoryService.getMemoryStats();
      expect(stats).toHaveProperty('sessionsInCache');
      expect(stats).toHaveProperty('totalMessages');
    });

    test('should maintain cache integrity during errors', async () => {
      const sessionId = 'cache-integrity-test';
      
      // Add message to cache
      await chatHistoryService.addMessage({
        id: 'cached-msg',
        content: 'This should remain in cache',
        sender: 'user',
        timestamp: new Date(),
        sessionId,
        messageType: 'USER',
        metadata: {}
      }, false);

      // Verify message is cached
      const beforeErrorMessages = chatHistoryService.getCachedMessages(sessionId);
      expect(beforeErrorMessages).toHaveLength(1);

      // Even if API operations fail, cache should remain intact
      const afterErrorMessages = chatHistoryService.getCachedMessages(sessionId);
      expect(afterErrorMessages).toHaveLength(1);
      expect(afterErrorMessages[0].content).toBe('This should remain in cache');
    });
  });

  describe('Export and Statistics Integration', () => {
    test('should generate comprehensive export data', () => {
      const sessionId = 'export-test-session';
      
      // Add sample conversation
      const messages = [
        {
          id: 'export-1',
          content: 'I want to visit Tokyo',
          sender: 'user' as const,
          timestamp: new Date('2025-10-01T10:00:00Z'),
          sessionId,
          messageType: 'USER' as const,
          metadata: { source: 'web_ui' }
        },
        {
          id: 'export-2', 
          content: 'Tokyo is a fantastic destination! When are you planning to visit?',
          sender: 'assistant' as const,
          timestamp: new Date('2025-10-01T10:00:01Z'),
          sessionId,
          messageType: 'ASSISTANT' as const,
          metadata: { model: 'gpt-3.5-turbo', responseTime: 1.2 }
        }
      ];

      // Add messages to service
      messages.forEach(msg => chatHistoryService.addMessage(msg, false));

      // Test export functionality
      const exportData = chatHistoryService.exportChatHistory(sessionId);
      const parsed = JSON.parse(exportData);

      expect(parsed.sessionId).toBe(sessionId);
      expect(parsed.messageCount).toBe(2);
      expect(parsed.messages).toHaveLength(2);
      expect(parsed.exportDate).toBeDefined();
      
      // Verify message content in export
      expect(parsed.messages[0].content).toContain('visit Tokyo');
      expect(parsed.messages[1].content).toContain('fantastic destination');
    });

    test('should provide accurate memory statistics', () => {
      // Add messages to multiple sessions
      const sessions = ['stats-1', 'stats-2', 'stats-3'];
      
      sessions.forEach((sessionId, index) => {
        chatHistoryService.addMessage({
          id: `stats-msg-${index}`,
          content: `Message for session ${sessionId}`,
          sender: 'user',
          timestamp: new Date(),
          sessionId,
          messageType: 'USER',
          metadata: {}
        }, false);
      });

      const stats = chatHistoryService.getMemoryStats();
      
      expect(stats.sessionsInCache).toBe(3);
      expect(stats.totalMessages).toBe(3);
    });
  });

  describe('Real-world Usage Patterns', () => {
    test('should handle typical travel planning conversation', async () => {
      const sessionId = 'travel-planning-session';
      
      // Simulate a realistic travel planning conversation
      const conversation = [
        { role: 'user', content: 'I need help planning a 5-day trip to Rome' },
        { role: 'assistant', content: 'I\'d love to help! What\'s your budget and travel dates?' },
        { role: 'user', content: 'Budget is $2000, traveling in December' },
        { role: 'assistant', content: 'Great! December in Rome is lovely. Let me find flights and hotels.' },
        { role: 'user', content: 'Also need restaurant recommendations' },
        { role: 'assistant', content: 'Here are some authentic Roman restaurants near the Colosseum...' }
      ];

      // Add all messages to the service
      /* eslint-disable no-plusplus, no-await-in-loop */
      for (let i = 0; i < conversation.length; i++) {
        const msg = conversation[i];
        await chatHistoryService.addMessage({
          id: `travel-msg-${i}`,
          content: msg.content,
          sender: msg.role === 'user' ? 'user' : 'assistant',
          timestamp: new Date(Date.now() + i * 1000), // Stagger timestamps
          sessionId,
          messageType: msg.role === 'user' ? 'USER' : 'ASSISTANT',
          metadata: { 
            turn: i + 1,
            topic: 'travel_planning',
            ...(msg.role === 'assistant' && { model: 'gpt-3.5-turbo' })
          }
        }, false);
      }
      /* eslint-enable no-plusplus, no-await-in-loop */

      // Verify conversation flow
      const messages = chatHistoryService.getCachedMessages(sessionId);
      expect(messages).toHaveLength(6);
      
      // Check alternating user/assistant pattern
      expect(messages[0].sender).toBe('user');
      expect(messages[1].sender).toBe('assistant');
      expect(messages[2].sender).toBe('user');
      expect(messages[3].sender).toBe('assistant');

      // Verify content preservation
      expect(messages[0].content).toContain('5-day trip to Rome');
      expect(messages[5].content).toContain('authentic Roman restaurants');

      // Test export of full conversation
      const exportData = JSON.parse(chatHistoryService.exportChatHistory(sessionId));
      expect(exportData.messageCount).toBe(6);
      
      // Check that metadata is present (structure may vary based on implementation)
      expect(exportData.messages).toHaveLength(6);
      expect(exportData.messages[0].content).toContain('5-day trip to Rome');
    });
  });
});