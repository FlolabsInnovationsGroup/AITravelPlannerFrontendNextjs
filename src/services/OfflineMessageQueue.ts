/**
 * Offline Message Queue Service
 * Handles message queuing when offline and automatic sending when connection restored
 */

export interface QueuedMessage {
  id: string;
  content: string;
  timestamp: number;
  retryCount: number;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface QueueStats {
  totalQueued: number;
  totalSent: number;
  totalFailed: number;
  lastQueueTime?: number;
  lastSendTime?: number;
}

class OfflineMessageQueue {
  private queue: QueuedMessage[] = [];
  private readonly STORAGE_KEY = 'offline_message_queue';
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly MAX_RETRY_COUNT = 3;
  private stats: QueueStats = {
    totalQueued: 0,
    totalSent: 0,
    totalFailed: 0
  };

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add a message to the queue
   */
  enqueue(message: Omit<QueuedMessage, 'id' | 'timestamp' | 'retryCount'>): QueuedMessage {
    const queuedMessage: QueuedMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    // Enforce max queue size
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      console.warn('Message queue full, removing oldest message');
      this.queue.shift();
    }

    this.queue.push(queuedMessage);
    this.stats.totalQueued += 1;
    this.stats.lastQueueTime = Date.now();
    this.saveToStorage();

    return queuedMessage;
  }

  /**
   * Get all queued messages
   */
  getAll(): QueuedMessage[] {
    return [...this.queue];
  }

  /**
   * Get messages for a specific session
   */
  getBySession(sessionId: string): QueuedMessage[] {
    return this.queue.filter(msg => msg.sessionId === sessionId);
  }

  /**
   * Remove a message from the queue
   */
  dequeue(messageId: string): QueuedMessage | null {
    const index = this.queue.findIndex(msg => msg.id === messageId);
    if (index === -1) return null;

    const [message] = this.queue.splice(index, 1);
    this.saveToStorage();
    return message;
  }

  /**
   * Mark message as sent successfully
   */
  markAsSent(messageId: string): void {
    const message = this.dequeue(messageId);
    if (message) {
      this.stats.totalSent += 1;
      this.stats.lastSendTime = Date.now();
    }
  }

  /**
   * Mark message as failed and retry or remove
   */
  markAsFailed(messageId: string): boolean {
    const index = this.queue.findIndex(msg => msg.id === messageId);
    if (index === -1) return false;

    const message = this.queue[index];
    message.retryCount += 1;

    if (message.retryCount >= this.MAX_RETRY_COUNT) {
      // Max retries reached, remove from queue
      this.queue.splice(index, 1);
      this.stats.totalFailed += 1;
      this.saveToStorage();
      return false;
    }

    // Keep in queue for retry
    this.saveToStorage();
    return true;
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.queue = [];
    this.saveToStorage();
  }

  /**
   * Clear messages for a specific session
   */
  clearSession(sessionId: string): void {
    this.queue = this.queue.filter(msg => msg.sessionId !== sessionId);
    this.saveToStorage();
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return { ...this.stats };
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue has messages
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Save queue to localStorage
   */
  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const data = {
          queue: this.queue,
          stats: this.stats
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to save message queue to storage:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          this.queue = data.queue || [];
          this.stats = data.stats || this.stats;
        }
      }
    } catch (error) {
      console.error('Failed to load message queue from storage:', error);
      this.queue = [];
    }
  }

  /**
   * Export queue for debugging
   */
  exportQueue(): string {
    return JSON.stringify({
      queue: this.queue,
      stats: this.stats,
      timestamp: Date.now()
    }, null, 2);
  }
}

// Singleton instance
export const offlineMessageQueue = new OfflineMessageQueue();

export default offlineMessageQueue;
