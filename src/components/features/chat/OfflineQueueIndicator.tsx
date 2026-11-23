'use client';

import React from 'react';
import { Cloud, CloudOff, Send, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QueuedMessage } from '@/services/OfflineMessageQueue';

interface OfflineQueueIndicatorProps {
  isOnline: boolean;
  queueSize: number;
  queuedMessages: QueuedMessage[];
  isSending: boolean;
  onSendQueue: () => void;
  onClearQueue: () => void;
  className?: string;
}

export const OfflineQueueIndicator: React.FC<OfflineQueueIndicatorProps> = ({
  isOnline,
  queueSize,
  queuedMessages,
  isSending,
  onSendQueue,
  onClearQueue,
  className = ''
}) => {
  // Don't show anything if online and queue is empty
  if (isOnline && queueSize === 0) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Status Header */}
      <div className={`flex items-center gap-2 px-4 py-2 border-b ${
        isOnline ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
      }`}>
        {isOnline ? (
          <>
            <Cloud className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Connected
            </span>
          </>
        ) : (
          <>
            <CloudOff className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Offline
            </span>
          </>
        )}
        
        {queueSize > 0 && (
          <span className="ml-auto text-xs text-gray-600">
            {queueSize} message{queueSize !== 1 ? 's' : ''} queued
          </span>
        )}
      </div>

      {/* Queue Messages */}
      {queueSize > 0 && (
        <div className="p-3">
          {/* Info Message */}
          <div className="flex items-start gap-2 mb-3 p-2 bg-blue-50 rounded-md">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              {isOnline 
                ? 'Messages will be sent automatically' 
                : 'Messages will be sent when connection is restored'}
            </p>
          </div>

          {/* Queued Messages List */}
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {queuedMessages.map((message) => (
              <div 
                key={message.id}
                className="p-2 bg-gray-50 rounded border border-gray-200"
              >
                <p className="text-xs text-gray-700 line-clamp-2">
                  {message.content}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  {message.retryCount > 0 && (
                    <span className="text-xs text-orange-600">
                      Retry {message.retryCount}/3
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={onSendQueue}
              disabled={isSending || !isOnline}
              size="sm"
              className="flex-1"
              type="button"
            >
              <Send className="w-3 h-3 mr-1" />
              {isSending ? 'Sending...' : 'Send Now'}
            </Button>
            <Button
              onClick={onClearQueue}
              disabled={isSending}
              variant="outline"
              size="sm"
              type="button"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineQueueIndicator;
