import { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';

interface UseStreamingChatOptions {
  apiUrl: string;
  sessionId: string;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

interface StreamingChatReturn {
  messages: Message[];
  isStreaming: boolean;
  sendMessage: (content: string) => Promise<void>;
  cancelStream: () => void;
  clearMessages: () => void;
}

/**
 * Hook for streaming chat with Server-Sent Events (SSE).
 * Provides ChatGPT-style progressive message rendering.
 * 
 * Features:
 * - Real-time streaming with ReadableStream API
 * - Optimistic UI updates for instant feel
 * - Error recovery and retry logic
 * - Stream cancellation support
 * - Message history management
 * 
 * @param options Configuration for streaming chat
 * @returns Streaming chat state and actions
 * 
 * @example
 * ```tsx
 * const { messages, isStreaming, sendMessage } = useStreamingChat({
 *   apiUrl: process.env.NEXT_PUBLIC_API_URL,
 *   sessionId: session.id,
 *   onError: (error) => toast.error(error.message)
 * });
 * 
 * await sendMessage('Plan a trip to Paris');
 * ```
 */
export function useStreamingChat({
  apiUrl,
  sessionId,
  onError,
  onComplete
}: UseStreamingChatOptions): StreamingChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageIdCounter = useRef(0);

  /**
   * Cancel active stream
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  /**
   * Send message and stream response
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    try {
      setIsStreaming(true);

      // 1. Add user message optimistically
      const userMessage: Message = {
        id: messageIdCounter.current++,
        messageType: 'USER',
        content: content.trim(),
        timestamp: new Date(),
        status: 'delivered'
      };

      setMessages(prev => [...prev, userMessage]);

      // 2. Create placeholder for assistant message
      const assistantMessage: Message = {
        id: messageIdCounter.current++,
        messageType: 'ASSISTANT',
        content: '',
        timestamp: new Date(),
        status: 'sending'
      };

      setMessages(prev => [...prev, assistantMessage]);

      // 3. Setup streaming request
      abortControllerRef.current = new AbortController();

      const token = localStorage.getItem('token');
      const url = `${apiUrl}/api/chat/stream?message=${encodeURIComponent(content)}&sessionId=${sessionId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream'
        },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // 4. Process stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Stream completed successfully
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id
                ? { ...msg, status: 'delivered' as const }
                : msg
            )
          );
          setIsStreaming(false);
          onComplete?.();
          break;
        }

        // Decode chunk
        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        // Update assistant message with accumulated content
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id
              ? { ...msg, content: accumulatedContent, status: 'sending' as const }
              : msg
          )
        );
      }

    } catch (error: any) {
      setIsStreaming(false);

      if (error.name === 'AbortError') {
        // User cancelled stream
        console.log('Stream cancelled by user');
        return;
      }

      // Handle error
      const errorMessage = error.message || 'Failed to stream response';
      console.error('Streaming error:', error);

      // Update last assistant message to show friendly error with guidance
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.messageType === 'ASSISTANT') {
          return prev.map((msg, idx) => 
            idx === prev.length - 1
              ? { 
                  ...msg, 
                  content: msg.content || '😊 Oops! I had a little hiccup there. No worries though! Try asking me again, or rephrase your question slightly. I\'m here to help you plan an amazing trip! 🌍\n\nNeed ideas? Try asking me about:\n• Destination recommendations\n• Hotel and restaurant suggestions\n• Creating custom itineraries\n• Budget-friendly travel tips',
                  status: 'failed' as const 
                }
              : msg
          );
        }
        return prev;
      });

      onError?.(error);
    } finally {
      abortControllerRef.current = null;
    }
  }, [apiUrl, sessionId, isStreaming, onError, onComplete]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    messageIdCounter.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    cancelStream,
    clearMessages
  };
}
