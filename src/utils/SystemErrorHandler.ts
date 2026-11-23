/**
 * Comprehensive error handling utility for the AI Travel Planner system
 * Provides production-grade error management, recovery strategies, and user feedback
 */

export interface ErrorContext {
  component: string;
  action: string;
  sessionId?: string;
  userId?: string;
  timestamp: number;
  additionalData?: Record<string, any>;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  userMessage: string;
  shouldRetry: boolean;
  retryAfterMs?: number;
  fallbackAction?: string;
}

export class SystemErrorHandler {
  private static instance: SystemErrorHandler;

  private errorQueue: Array<{ context: ErrorContext; error: Error }> = [];

  private readonly maxRetries = 3;

  private readonly baseRetryDelay = 1000; // 1 second

  static getInstance(): SystemErrorHandler {
    if (!SystemErrorHandler.instance) {
      SystemErrorHandler.instance = new SystemErrorHandler();
    }
    return SystemErrorHandler.instance;
  }

  /**
   * Handle map-related errors with specific recovery strategies
   */
  handleMapError(error: Error, context: ErrorContext): ErrorResponse {
    console.error(`🗺️ Map Error in ${context.component}:`, error);

    // Google Maps API errors
    if (error.message.includes('REQUEST_DENIED')) {
      return {
        success: false,
        message: 'Google Maps API key restriction error',
        userMessage: 'Map temporarily unavailable. Please try refreshing the page.',
        shouldRetry: false,
        fallbackAction: 'showMapPlaceholder'
      };
    }

    // Network/connectivity errors
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      return {
        success: false,
        message: 'Network connectivity issue',
        userMessage: 'Connection lost. Attempting to reconnect...',
        shouldRetry: true,
        retryAfterMs: this.calculateRetryDelay(1),
        fallbackAction: 'enableOfflineMode'
      };
    }

    // Location service errors
    if (error.message.includes('location') || error.message.includes('geolocation')) {
      return {
        success: false,
        message: 'Location service error',
        userMessage: 'Unable to access location. You can still search for places manually.',
        shouldRetry: false,
        fallbackAction: 'showLocationSearch'
      };
    }

    // Generic map error
    return {
      success: false,
      message: 'Unknown map error',
      userMessage: 'Map encountered an issue. Please try refreshing.',
      shouldRetry: true,
      retryAfterMs: this.calculateRetryDelay(1)
    };
  }

  /**
   * Handle WebSocket connection errors with intelligent retry
   */
  handleWebSocketError(error: Error, context: ErrorContext): ErrorResponse {
    console.error(`🔌 WebSocket Error in ${context.component}:`, error);

    // Connection refused/server unavailable
    if (error.message.includes('Connection refused') || error.message.includes('503')) {
      return {
        success: false,
        message: 'Server temporarily unavailable',
        userMessage: 'Real-time updates temporarily disabled. Your actions are still saved.',
        shouldRetry: true,
        retryAfterMs: this.calculateRetryDelay(2),
        fallbackAction: 'enablePolling'
      };
    }

    // Authentication/authorization errors
    if (error.message.includes('401') || error.message.includes('403')) {
      return {
        success: false,
        message: 'Authentication error',
        userMessage: 'Session expired. Please refresh to continue.',
        shouldRetry: false,
        fallbackAction: 'redirectToLogin'
      };
    }

    // Network timeout
    if (error.message.includes('timeout')) {
      return {
        success: false,
        message: 'Connection timeout',
        userMessage: 'Connection slow. Retrying...',
        shouldRetry: true,
        retryAfterMs: this.calculateRetryDelay(1)
      };
    }

    return {
      success: false,
      message: 'WebSocket connection error',
      userMessage: 'Real-time updates may be delayed.',
      shouldRetry: true,
      retryAfterMs: this.calculateRetryDelay(1)
    };
  }

  /**
   * Handle AI function calling errors
   */
  handleAIFunctionError(error: Error, context: ErrorContext): ErrorResponse {
    console.error(`🤖 AI Function Error in ${context.component}:`, error);

    // Rate limiting
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return {
        success: false,
        message: 'API rate limit exceeded',
        userMessage: 'Too many requests. Please wait a moment and try again.',
        shouldRetry: true,
        retryAfterMs: 30000, // 30 seconds
        fallbackAction: 'showCachedResponse'
      };
    }

    // API key issues
    if (error.message.includes('401') || error.message.includes('invalid key')) {
      return {
        success: false,
        message: 'API authentication error',
        userMessage: 'Service temporarily unavailable. Please try again later.',
        shouldRetry: false,
        fallbackAction: 'enableBasicMode'
      };
    }

    // Parsing/validation errors
    if (error.message.includes('parse') || error.message.includes('validation')) {
      return {
        success: false,
        message: 'Invalid response format',
        userMessage: 'Unable to process response. Please rephrase your request.',
        shouldRetry: false,
        fallbackAction: 'showExampleQueries'
      };
    }

    return {
      success: false,
      message: 'AI service error',
      userMessage: 'AI assistant temporarily unavailable. Basic functions still work.',
      shouldRetry: true,
      retryAfterMs: this.calculateRetryDelay(1),
      fallbackAction: 'enableBasicMode'
    };
  }

  /**
   * Handle location extraction and search errors
   */
  handleLocationError(error: Error, context: ErrorContext): ErrorResponse {
    console.error(`📍 Location Error in ${context.component}:`, error);

    // Place not found
    if (error.message.includes('not found') || error.message.includes('ZERO_RESULTS')) {
      return {
        success: false,
        message: 'Location not found',
        userMessage: 'Location not found. Try a more specific name or nearby landmark.',
        shouldRetry: false,
        fallbackAction: 'suggestAlternatives'
      };
    }

    // Geocoding quota exceeded
    if (error.message.includes('quota') || error.message.includes('OVER_QUERY_LIMIT')) {
      return {
        success: false,
        message: 'Location service quota exceeded',
        userMessage: 'Location lookup temporarily limited. Manual coordinates still work.',
        shouldRetry: true,
        retryAfterMs: 3600000, // 1 hour
        fallbackAction: 'enableManualCoordinates'
      };
    }

    return {
      success: false,
      message: 'Location service error',
      userMessage: 'Unable to find location. Try searching again.',
      shouldRetry: true,
      retryAfterMs: this.calculateRetryDelay(1)
    };
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateRetryDelay(attempt: number): number {
    return Math.min(this.baseRetryDelay * 2**(attempt - 1), 30000); // Max 30 seconds
  }

  /**
   * Log error for monitoring and debugging
   */
  private logError(error: Error, context: ErrorContext): void {
    const errorLog = {
      timestamp: context.timestamp,
      component: context.component,
      action: context.action,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: context.additionalData,
      sessionId: context.sessionId,
      userId: context.userId
    };

    // In production, send to monitoring service
    console.error('🚨 System Error:', errorLog);
    
    // Queue for batch sending to monitoring service
    this.errorQueue.push({ context, error });
    this.flushErrorQueue();
  }

  /**
   * Flush error queue to monitoring service (placeholder)
   */
  private flushErrorQueue(): void {
    if (this.errorQueue.length >= 10) {
      // In production, send batch to monitoring service
      this.errorQueue = [];
    }
  }

  /**
   * Create error context helper
   */
  static createContext(component: string, action: string, additionalData?: Record<string, any>): ErrorContext {
    return {
      component,
      action,
      timestamp: Date.now(),
      additionalData
    };
  }
}