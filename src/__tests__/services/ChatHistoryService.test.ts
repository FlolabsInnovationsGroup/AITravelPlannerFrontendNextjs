import { ChatHistoryService, MessageHistory } from '../../services/ChatHistoryService';

// Mock axios
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
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock console methods to avoid noise in test output
console.log = jest.fn();
console.error = jest.fn();

describe('ChatHistoryService', () => {
  let service: ChatHistoryService;

  beforeEach(() => {
    service = new ChatHistoryService();
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  test('should create service instance', () => {
    expect(service).toBeInstanceOf(ChatHistoryService);
  });

  test('should create proper message history format', () => {
    const sessionId = 'test-session-123';
    const mockMessage: MessageHistory = {
      id: '1',
      content: 'Hello world',
      sender: 'user',
      timestamp: new Date(),
      sessionId,
      messageType: 'USER',
      metadata: { source: 'test' }
    };

    // Test that the message structure matches our interface
    expect(mockMessage.id).toBe('1');
    expect(mockMessage.content).toBe('Hello world');
    expect(mockMessage.sender).toBe('user');
    expect(mockMessage.sessionId).toBe(sessionId);
    expect(mockMessage.messageType).toBe('USER');
    expect(mockMessage.metadata?.source).toBe('test');
  });

  test('should handle assistant messages', () => {
    const mockMessage: MessageHistory = {
      id: '2',
      content: 'AI response',
      sender: 'assistant',
      timestamp: new Date(),
      sessionId: 'test-session',
      messageType: 'ASSISTANT',
      metadata: { model: 'gpt-3.5-turbo' }
    };

    expect(mockMessage.sender).toBe('assistant');
    expect(mockMessage.messageType).toBe('ASSISTANT');
    expect(mockMessage.metadata?.model).toBe('gpt-3.5-turbo');
  });

  test('should have required service methods', () => {
    // Check that all required methods exist
    expect(typeof service.fetchChatHistory).toBe('function');
    expect(typeof service.addMessage).toBe('function');
    expect(typeof service.verifyMessagePersistence).toBe('function');
    expect(typeof service.getCachedMessages).toBe('function');
    expect(typeof service.exportChatHistory).toBe('function');
    expect(typeof service.getMemoryStats).toBe('function');
    expect(typeof service.getMessagePersistenceDebug).toBe('function');
  });

  test('should export empty chat history when no messages', () => {
    const sessionId = 'empty-session';
    const exported = service.exportChatHistory(sessionId);
    
    // Parse the JSON export
    const exportData = JSON.parse(exported);
    expect(exportData.sessionId).toBe(sessionId);
    expect(exportData.messageCount).toBe(0);
    expect(exportData.messages).toEqual([]);
    expect(exportData.exportDate).toBeDefined();
  });

  test('should get initial memory stats', () => {
    const stats = service.getMemoryStats();
    
    expect(stats).toHaveProperty('sessionsInCache');
    expect(stats).toHaveProperty('totalMessages');
    expect(typeof stats.sessionsInCache).toBe('number');
    expect(typeof stats.totalMessages).toBe('number');
  });
});