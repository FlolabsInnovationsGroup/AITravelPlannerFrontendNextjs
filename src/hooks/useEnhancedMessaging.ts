import { useState, useCallback, useRef, useMemo } from 'react';
import { MessageStatus } from '@/components/ui/ChatUIComponents';
import { useMessageRetry, useChatErrorHandler } from './useMessageRetry';

interface Message {
  id: number;
  messageType: 'USER' | 'ASSISTANT';
  content: string;
  timestamp?: Date;
  status?: MessageStatus;
  originalMessage?: string; // Store original user input for retry
}

interface SendMessageOptions {
  enableRetry?: boolean;
  retryOptions?: {
    maxAttempts?: number;
    baseDelay?: number;
  };
  onProgress?: (progress: number) => void;
  onStatusChange?: (status: MessageStatus) => void;
}

interface UseEnhancedMessagingResult {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (message: string, options?: SendMessageOptions) => Promise<void>;
  retryMessage: (messageId: number) => Promise<void>;
  cancelMessage: (messageId: number) => void;
  clearMessages: () => void;
  updateMessageStatus: (messageId: number, status: Partial<MessageStatus>) => void;
  getFailedMessages: () => Message[];
  retryAllFailed: () => Promise<void>;
}

export const useEnhancedMessaging = (
  sendMessageApi: (message: string) => Promise<any>
): UseEnhancedMessagingResult => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { retryMessage: retryOperation, retryState, cancelRetry } = useMessageRetry();
  const { handleError } = useChatErrorHandler();
  
  const activeOperationsRef = useRef<Map<number, AbortController>>(new Map());
  const messageIdCounterRef = useRef(0);

  const generateMessageId = useCallback(() => {
    messageIdCounterRef.current += 1;
    return messageIdCounterRef.current;
  }, []);

  const updateMessageStatus = useCallback((messageId: number, statusUpdate: Partial<MessageStatus>) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.status) {
        return {
          ...msg,
          status: {
            ...msg.status,
            ...statusUpdate,
            timestamp: statusUpdate.timestamp || new Date()
          }
        };
      }
      return msg;
    }));
  }, []);

  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    const newMessage: Message = {
      ...message,
      id: generateMessageId(),
      timestamp: message.timestamp || new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, [generateMessageId]);



  const createAbortableOperation = useCallback(<T,>(
    messageId: number,
    operation: (signal: AbortSignal) => Promise<T>
  ): Promise<T> => {
    const controller = new AbortController();
    activeOperationsRef.current.set(messageId, controller);
    
    const promise = operation(controller.signal).finally(() => {
      activeOperationsRef.current.delete(messageId);
    });

    return promise;
  }, []);

  const performSendMessage = useCallback(async (
    message: string,
    messageId: number,
    signal?: AbortSignal
  ) => {
    if (signal?.aborted) {
      throw new Error('Operation cancelled');
    }

    try {
      updateMessageStatus(messageId, { status: 'sending' });
      
      const response = await sendMessageApi(message);
      
      if (signal?.aborted) {
        throw new Error('Operation cancelled');
      }

      updateMessageStatus(messageId, { status: 'sent' });
      
      // Add AI response
      if (response?.message) {
        addMessage({
          messageType: 'ASSISTANT',
          content: response.message,
          status: {
            id: generateMessageId(),
            status: 'delivered',
            timestamp: new Date()
          }
        });
      }
      
      // Simulate delivery confirmation (in a real app, this would come from the server)
      setTimeout(() => {
        updateMessageStatus(messageId, { status: 'delivered' });
      }, 1000);

      return response;
    } catch (error: any) {
      if (signal?.aborted || error.message === 'Operation cancelled') {
        updateMessageStatus(messageId, { status: 'failed', error: 'Cancelled' });
        return undefined;
      }

      const { errorMessage } = handleError(error, 'sendMessage');
      updateMessageStatus(messageId, { 
        status: 'failed', 
        error: errorMessage 
      });
      throw error;
    }
  }, [sendMessageApi, updateMessageStatus, addMessage, generateMessageId, handleError]);

  const sendMessage = useCallback(async (
    message: string,
    options: SendMessageOptions = {}
  ) => {
    if (!message.trim()) return;

    setIsLoading(true);
    
    const messageId = addMessage({
      messageType: 'USER',
      content: message,
      originalMessage: message,
      status: {
        id: generateMessageId(),
        status: 'sending',
        timestamp: new Date()
      }
    });

    try {
      if (options.enableRetry !== false) {
        // Use retry mechanism
        await retryOperation(
          () => createAbortableOperation(messageId, (signal) => 
            performSendMessage(message, messageId, signal)
          ),
          {
            maxAttempts: options.retryOptions?.maxAttempts || 3,
            baseDelay: options.retryOptions?.baseDelay || 1000,
            retryCondition: (error: any) => {
              // Don't retry if cancelled or user input error
              if (error.message === 'Operation cancelled' || 
                  error.response?.status === 400 || 
                  error.response?.status === 422) {
                return false;
              }
              return true;
            }
          }
        );
      } else {
        // Direct send without retry
        await createAbortableOperation(messageId, (signal) => 
          performSendMessage(message, messageId, signal)
        );
      }
    } catch (error: any) {
      console.error('❌ Failed to send message after retries:', error);
      
      // Don't add error message if it was cancelled
      if (error.message !== 'Operation cancelled') {
        addMessage({
          messageType: 'ASSISTANT',
          content: error.message || 'Failed to send message. You can retry by clicking the retry button.',
          status: {
            id: generateMessageId(),
            status: 'delivered',
            timestamp: new Date()
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    addMessage,
    generateMessageId,
    retryOperation,
    createAbortableOperation,
    performSendMessage
  ]);

  const retryMessage = useCallback(async (messageId: number) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message || !message.originalMessage) {
      console.error('❌ Cannot retry message: Original message not found');
      return;
    }

    updateMessageStatus(messageId, { 
      status: 'retrying',
      retryCount: (message.status?.retryCount || 0) + 1
    });

    try {
      await createAbortableOperation(messageId, (signal) => 
        performSendMessage(message.originalMessage!, messageId, signal)
      );
    } catch (error: any) {
      console.error('❌ Retry failed:', error);
      updateMessageStatus(messageId, { 
        status: 'failed',
        error: error.message || 'Retry failed'
      });
    }
  }, [messages, updateMessageStatus, createAbortableOperation, performSendMessage]);

  const cancelMessage = useCallback((messageId: number) => {
    const controller = activeOperationsRef.current.get(messageId);
    if (controller) {
      controller.abort();
      activeOperationsRef.current.delete(messageId);
    }
    
    updateMessageStatus(messageId, { status: 'failed', error: 'Cancelled' });
    
    // If this was a retry operation, cancel it
    if (retryState.isRetrying) {
      cancelRetry();
    }
  }, [updateMessageStatus, retryState.isRetrying, cancelRetry]);

  const clearMessages = useCallback(() => {
    // Cancel all active operations
    activeOperationsRef.current.forEach(controller => {
      controller.abort();
    });
    activeOperationsRef.current.clear();
    
    setMessages([]);
    setIsLoading(false);
  }, []);

  const getFailedMessages = useCallback(() => messages.filter(msg => msg.status?.status === 'failed'), [messages]);

  const retryAllFailed = useCallback(async () => {
    const failedMessages = getFailedMessages();
    
    await Promise.all(
      failedMessages
        .filter(message => message.originalMessage)
        .map(message => retryMessage(message.id))
    );
  }, [getFailedMessages, retryMessage]);

  // Memoize computed values
  const computedIsLoading = useMemo(() => isLoading || 
           messages.some(msg => 
             msg.status?.status === 'sending' || 
             msg.status?.status === 'retrying'
           ) ||
           retryState.isRetrying, [isLoading, messages, retryState.isRetrying]);

  return {
    messages,
    isLoading: computedIsLoading,
    sendMessage,
    retryMessage,
    cancelMessage,
    clearMessages,
    updateMessageStatus,
    getFailedMessages,
    retryAllFailed
  };
};