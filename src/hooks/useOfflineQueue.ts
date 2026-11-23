import { useState, useEffect, useCallback } from 'react';
import offlineMessageQueue, { QueuedMessage, QueueStats } from '@/services/OfflineMessageQueue';

interface UseOfflineQueueOptions {
  sessionId: string;
  onSendMessage: (content: string) => Promise<void>;
  isOnline: boolean;
  autoSendOnReconnect?: boolean;
}

interface UseOfflineQueueResult {
  queuedMessages: QueuedMessage[];
  queueSize: number;
  stats: QueueStats;
  enqueueMessage: (content: string, metadata?: Record<string, any>) => void;
  sendQueuedMessages: () => Promise<void>;
  clearQueue: () => void;
  isSending: boolean;
}

export const useOfflineQueue = ({
  sessionId,
  onSendMessage,
  isOnline,
  autoSendOnReconnect = true
}: UseOfflineQueueOptions): UseOfflineQueueResult => {
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const [stats, setStats] = useState<QueueStats>(offlineMessageQueue.getStats());
  const [isSending, setIsSending] = useState(false);

  // Update queued messages from queue
  const refreshQueue = useCallback(() => {
    setQueuedMessages(offlineMessageQueue.getBySession(sessionId));
    setStats(offlineMessageQueue.getStats());
  }, [sessionId]);

  // Enqueue a message when offline
  const enqueueMessage = useCallback((content: string, metadata?: Record<string, any>) => {
    offlineMessageQueue.enqueue({
      content,
      sessionId,
      metadata
    });
    refreshQueue();
  }, [sessionId, refreshQueue]);

  // Send all queued messages
  const sendQueuedMessages = useCallback(async () => {
    const messages = offlineMessageQueue.getBySession(sessionId);
    if (messages.length === 0) return;

    setIsSending(true);

    try {
      // Send messages sequentially to maintain order
      for (const message of messages) {
        try {
          await onSendMessage(message.content);
          offlineMessageQueue.markAsSent(message.id);
        } catch (error) {
          console.error('Failed to send queued message:', error);
          const shouldRetry = offlineMessageQueue.markAsFailed(message.id);
          if (!shouldRetry) {
            console.warn('Message failed after max retries:', message.id);
          }
        }
      }
    } finally {
      setIsSending(false);
      refreshQueue();
    }
  }, [sessionId, onSendMessage, refreshQueue]);

  // Clear all queued messages for this session
  const clearQueue = useCallback(() => {
    offlineMessageQueue.clearSession(sessionId);
    refreshQueue();
  }, [sessionId, refreshQueue]);

  // Auto-send queued messages when coming back online
  useEffect(() => {
    if (isOnline && autoSendOnReconnect && !isSending) {
      const messages = offlineMessageQueue.getBySession(sessionId);
      if (messages.length > 0) {
        console.log(`Connection restored. Sending ${messages.length} queued messages...`);
        sendQueuedMessages();
      }
    }
  }, [isOnline, autoSendOnReconnect, sessionId, sendQueuedMessages, isSending]);

  // Refresh queue on mount and when sessionId changes
  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  return {
    queuedMessages,
    queueSize: queuedMessages.length,
    stats,
    enqueueMessage,
    sendQueuedMessages,
    clearQueue,
    isSending
  };
};

export default useOfflineQueue;
