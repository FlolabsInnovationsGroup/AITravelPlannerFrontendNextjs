/**
 * Enhanced retry mechanism for API calls and WebSocket connections
 * Best practices for travel app reliability
 */

export interface RetryOptions {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
    jitter: boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 1000,    // 1 second
    maxDelay: 30000,    // 30 seconds
    backoffFactor: 2,   // Exponential backoff
    jitter: true        // Add randomness to prevent thundering herd
};

export class RetryMechanism {
    static async withRetry<T>(
        operation: () => Promise<T>,
        options: Partial<RetryOptions> = {}
    ): Promise<T> {
        const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
        let lastError: Error;

        for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                
                if (attempt === config.maxAttempts) {
                    throw new Error(`Operation failed after ${config.maxAttempts} attempts: ${lastError.message}`);
                }

                // Calculate delay with exponential backoff and jitter
                let delay = Math.min(
                    config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
                    config.maxDelay
                );

                if (config.jitter) {
                    delay = delay * (0.5 + Math.random() * 0.5); // Add 0-50% jitter
                }

                console.warn(`Operation failed on attempt ${attempt}/${config.maxAttempts}. Retrying in ${Math.round(delay)}ms...`, error);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError!;
    }

    static isRetriableError(error: Error): boolean {
        // Network-related errors that are worth retrying
        const retriableErrors = [
            'NetworkError',
            'TimeoutError',
            'AbortError',
            'TypeError', // Often network-related in fetch
        ];

        const retriableMessages = [
            'fetch',
            'network',
            'timeout',
            'connection',
            'ENOTFOUND',
            'ECONNRESET',
            'ETIMEDOUT'
        ];

        return retriableErrors.includes(error.constructor.name) ||
               retriableMessages.some(msg => 
                   error.message.toLowerCase().includes(msg.toLowerCase())
               );
    }
}

// Specialized retry for WebSocket connections
export class WebSocketRetryManager {
    private retryCount = 0;
    private maxRetries: number;
    private baseDelay: number;
    
    constructor(maxRetries = 5, baseDelay = 1000) {
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
    }

    async shouldRetry(): Promise<boolean> {
        if (this.retryCount >= this.maxRetries) {
            return false;
        }

        const delay = this.baseDelay * Math.pow(2, this.retryCount);
        console.log(`WebSocket reconnection attempt ${this.retryCount + 1}/${this.maxRetries} in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        this.retryCount++;
        return true;
    }

    reset() {
        this.retryCount = 0;
    }

    getRetryCount() {
        return this.retryCount;
    }
}
