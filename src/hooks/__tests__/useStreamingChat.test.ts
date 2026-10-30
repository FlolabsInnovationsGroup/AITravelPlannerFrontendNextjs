/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStreamingChat } from '@/hooks/useStreamingChat';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useStreamingChat', () => {
  const mockSessionId = 'test-session-123';
  const mockApiUrl = 'http://localhost:8080';
  const mockOnError = jest.fn();
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useStreamingChat({
          apiUrl: mockApiUrl,
          sessionId: mockSessionId,
          onError: mockOnError,
          onComplete: mockOnComplete
        })
      );

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.messages).toEqual([]);
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.cancelStream).toBe('function');
    });

    it('should accept optional callbacks', () => {
      const { result } = renderHook(() =>
        useStreamingChat({
          apiUrl: mockApiUrl,
          sessionId: mockSessionId
        })
      );

      expect(result.current).toBeDefined();
      expect(typeof result.current.sendMessage).toBe('function');
    });
  });

  describe('Message Sending', () => {
    it('should send message and start streaming', async () => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"content":"Hello"}\n\n') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        cancel: jest.fn()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader
        }
      });

      const { result } = renderHook(() =>
        useStreamingChat({
          apiUrl: mockApiUrl,
          sessionId: mockSessionId,
          onComplete: mockOnComplete
        })
      );

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      await waitFor(() => {
        expect(result.current.messages.length).toBeGreaterThan(0);
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });

    it('should handle streaming errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useStreamingChat({
          apiUrl: mockApiUrl,
          sessionId: mockSessionId,
          onError: mockOnError
        })
      );

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
        expect(result.current.isStreaming).toBe(false);
      });
    });

    it('should accumulate chunked messages', async () => {
      const chunks = [
        'data: {"content":"Hello"}\n\n',
        'data: {"content":" world"}\n\n',
        'data: {"content":"!"}\n\n'
      ];

      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(chunks[0]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(chunks[1]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(chunks[2]) })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        cancel: jest.fn()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader
        }
      });

      const { result } = renderHook(() =>
        useStreamingChat({
          apiUrl: mockApiUrl,
          sessionId: mockSessionId
        })
      );

      await act(async () => {
        await result.current.sendMessage('Test');
      });

      await waitFor(() => {
        const lastMessage = result.current.messages[result.current.messages.length - 1];
        expect(lastMessage?.content).toContain('Hello');
      });
    });

    it('should add user message optimistically', async () => {
      const mockReader = {
        read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
        cancel: jest.fn()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader
        }
      });

      const { result } = renderHook(() =>
        useStreamingChat({
          apiUrl: mockApiUrl,
          sessionId: mockSessionId
        })
      );

      const testContent = 'Test message';

      await act(async () => {
        await result.current.sendMessage(testContent);
      });

      await waitFor(() => {
        const userMessage = result.current.messages.find(m => m.messageType === 'USER');
        expect(userMessage?.content).toBe(testContent);
      });
    });
  });

  describe('Stream Cancellation', () => {
    it('should cancel ongoing stream', async () => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"content":"Hello"}\n\n') })
          .mockImplementation(() => new Promise(() => {})), // Never resolves
        cancel: jest.fn()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader
        }
      });

      const { result } = renderHook(() =>
        useStreamingChat({
          apiUrl: mockApiUrl,
          sessionId: mockSessionId
        })
      );

      act(() => {
        result.current.sendMessage('Test');
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(true);
      });

      act(() => {
        result.current.cancelStream();
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      });
    });
  });

  describe('Error Recovery', () => {
    it('should reset state on new message after error', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          ok: true,
          body: {
            getReader: () => ({
              read: jest.fn()
                .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"content":"Success"}\n\n') })
                .mockResolvedValueOnce({ done: true, value: undefined }),
              cancel: jest.fn()
            })
          }
        });

      const { result } = renderHook(() =>
        useStreamingChat({
          apiUrl: mockApiUrl,
          sessionId: mockSessionId
        })
      );

      // First message fails
      await act(async () => {
        await result.current.sendMessage('First');
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      });

      // Second message succeeds
      await act(async () => {
        await result.current.sendMessage('Second');
      });

      await waitFor(() => {
        const lastMessage = result.current.messages[result.current.messages.length - 1];
        expect(lastMessage?.content).toContain('Success');
      });
    });

    it('should handle malformed JSON chunks', async () => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {invalid json}\n\n') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        cancel: jest.fn()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader
        }
      });

      const { result } = renderHook(() =>
        useStreamingChat({
          apiUrl: mockApiUrl,
          sessionId: mockSessionId,
          onError: mockOnError
        })
      );

      await act(async () => {
        await result.current.sendMessage('Test');
      });

      await waitFor(() => {
        // Should handle error gracefully without crashing
        expect(result.current.isStreaming).toBe(false);
      });
    });
  });

  describe('Connection State Management', () => {
    it('should update streaming state correctly', async () => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"content":"Test"}\n\n') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        cancel: jest.fn()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader
        }
      });

      const { result } = renderHook(() =>
        useStreamingChat({
          apiUrl: mockApiUrl,
          sessionId: mockSessionId
        })
      );

      expect(result.current.isStreaming).toBe(false);

      act(() => {
        result.current.sendMessage('Test');
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false);
      }, { timeout: 3000 });
    });

    it('should manage message history', async () => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"content":"Test"}\n\n') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        cancel: jest.fn()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader
        }
      });

      const { result } = renderHook(() =>
        useStreamingChat({
          apiUrl: mockApiUrl,
          sessionId: mockSessionId
        })
      );

      expect(result.current.messages).toEqual([]);

      await act(async () => {
        await result.current.sendMessage('Test');
      });

      await waitFor(() => {
        expect(result.current.messages.length).toBeGreaterThan(0);
      });
    });

    it('should clear messages', () => {
      const { result } = renderHook(() =>
        useStreamingChat({
          apiUrl: mockApiUrl,
          sessionId: mockSessionId
        })
      );

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toEqual([]);
    });
  });
});
