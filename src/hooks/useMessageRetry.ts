import { useCallback, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

interface MessageRetryState {
  attempts: number;
  lastError?: any;
  isRetrying: boolean;
}

interface UseMessageRetryResult {
  retryMessage: (operation: () => Promise<any>, options?: RetryOptions) => Promise<any>;
  retryState: MessageRetryState;
  cancelRetry: () => void;
}

const defaultRetryOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: any) => 
    // Retry on network errors, timeouts, and 5xx server errors
     (
      error.message?.includes('timeout') ||
      error.message?.includes('Network Error') ||
      error.code === 'NETWORK_ERROR' ||
      (error.response?.status >= 500 && error.response?.status < 600) ||
      error.response?.status === 429 // Rate limit - retry after delay
    )
  
};

export const useMessageRetry = (): UseMessageRetryResult => {
  const [retryState, setRetryState] = useState<MessageRetryState>({
    attempts: 0,
    isRetrying: false
  });
  
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const calculateDelay = (attempt: number, baseDelay: number, maxDelay: number, backoffFactor: number): number => {
    const delay = baseDelay * backoffFactor**attempt;
    return Math.min(delay, maxDelay);
  };

  const cancelRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setRetryState(prev => ({ ...prev, isRetrying: false }));
    isActiveRef.current = false;
  }, []);

  const retryMessage = useCallback(async (
    operation: () => Promise<any>,
    options: RetryOptions = {}
  ): Promise<any> => {
    const opts = { ...defaultRetryOptions, ...options };
    isActiveRef.current = true;
    
    setRetryState({
      attempts: 0,
      isRetrying: false,
      lastError: undefined
    });

    // Sequential retry attempts with exponential backoff
    // eslint-disable-next-line no-plusplus
    for (let attempt = 0; attempt < opts.maxAttempts; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      if (!isActiveRef.current) {
        throw new Error('Retry cancelled');
      }

      try {
        setRetryState(prev => ({ ...prev, attempts: attempt + 1 }));
        
        if (attempt > 0) {
          setRetryState(prev => ({ ...prev, isRetrying: true }));
          const delay = calculateDelay(attempt - 1, opts.baseDelay, opts.maxDelay, opts.backoffFactor);
          
          toast.loading(`Retrying message... (attempt ${attempt + 1}/${opts.maxAttempts})`, {
            duration: delay,
            id: 'message-retry'
          });

          // eslint-disable-next-line no-await-in-loop
          await new Promise(resolve => {
            retryTimeoutRef.current = setTimeout(resolve, delay);
          });

          if (!isActiveRef.current) {
            throw new Error('Retry cancelled');
          }
        }

        // eslint-disable-next-line no-await-in-loop
        const result = await operation();
        
        setRetryState(prev => ({ ...prev, isRetrying: false }));
        
        if (attempt > 0) {
          toast.success('Message sent successfully!', { id: 'message-retry' });
        }
        
        return result;

      } catch (error: any) {
        setRetryState(prev => ({ ...prev, lastError: error, isRetrying: false }));
        
        console.error(`❌ Attempt ${attempt + 1} failed:`, {
          error: error.message,
          status: error.response?.status,
          attempt: attempt + 1,
          maxAttempts: opts.maxAttempts
        });

        // Check if we should retry this error
        const shouldRetry = opts.retryCondition(error) && attempt < opts.maxAttempts - 1;
        
        if (!shouldRetry) {
          toast.dismiss('message-retry');
          
          // Provide specific error messages
          let errorMessage = "Failed to send message. Please try again.";
          
          if (error.response?.status === 401) {
            errorMessage = "Authentication failed. Please sign in again.";
          } else if (error.response?.status === 403) {
            errorMessage = "Access denied. Please check your permissions.";
          } else if (error.response?.status === 429) {
            errorMessage = "Rate limit exceeded. Please wait a moment before trying again.";
          } else if (error.response?.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          } else if (error.message?.includes('timeout')) {
            errorMessage = "Request timed out. Please check your connection and try again.";
          } else if (error.message?.includes('Network Error')) {
            errorMessage = "Network error. Please check your internet connection.";
          }

          throw new Error(errorMessage);
        }
      }
    }

    // This should never be reached, but just in case
    throw new Error('Maximum retry attempts exceeded');
  }, []);

  return {
    retryMessage,
    retryState,
    cancelRetry
  };
};

// Hook for handling chat-specific error states
export const useChatErrorHandler = () => {
  const [errorState, setErrorState] = useState<{
    hasError: boolean;
    errorMessage?: string;
    errorType?: 'network' | 'auth' | 'server' | 'validation' | 'unknown';
    canRetry: boolean;
  }>({
    hasError: false,
    canRetry: false
  });

  const handleError = useCallback((error: any, context: string = '') => {
    console.error(`❌ Chat Error${context ? ` [${context}]` : ''}:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      stack: error.stack
    });

    let errorType: 'network' | 'auth' | 'server' | 'validation' | 'unknown' = 'unknown';
    let errorMessage = 'An unexpected error occurred. Please try again.';
    let canRetry = true;

    if (error.response?.status === 401) {
      errorType = 'auth';
      errorMessage = 'Authentication failed. Please sign in again.';
      canRetry = false;
    } else if (error.response?.status === 403) {
      errorType = 'auth';
      errorMessage = 'Access denied. Please check your permissions.';
      canRetry = false;
    } else if (error.response?.status === 422) {
      errorType = 'validation';
      errorMessage = 'Invalid input. Please check your message and try again.';
      canRetry = false;
    } else if (error.response?.status === 429) {
      errorType = 'server';
      errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      canRetry = true;
    } else if (error.response?.status >= 500) {
      errorType = 'server';
      errorMessage = 'Server error. Please try again later.';
      canRetry = true;
    } else if (error.message?.includes('timeout')) {
      errorType = 'network';
      errorMessage = 'Request timed out. Please check your connection.';
      canRetry = true;
    } else if (error.message?.includes('Network Error')) {
      errorType = 'network';
      errorMessage = 'Network error. Please check your internet connection.';
      canRetry = true;
    }

    setErrorState({
      hasError: true,
      errorMessage,
      errorType,
      canRetry
    });

    return { errorMessage, errorType, canRetry };
  }, []);

  const clearError = useCallback(() => {
    setErrorState({ hasError: false, canRetry: false });
  }, []);

  return {
    errorState,
    handleError,
    clearError
  };
};