import React from 'react';
import { Loader2, AlertCircle, Wifi, WifiOff, Clock, CheckCircle2, Circle, RotateCcw, X } from 'lucide-react';
import { ConnectionState } from '@/hooks/useEnhancedWebSocket';

export interface MessageStatus {
  id: number;
  status: 'sending' | 'sent' | 'delivered' | 'failed' | 'retrying';
  timestamp?: Date;
  error?: string;
  retryCount?: number;
}

interface ConnectionStatusProps {
  connectionState: ConnectionState;
  connectionMetrics?: {
    connectionAttempts: number;
    totalReconnects: number;
    averageLatency?: number;
    lastConnectedAt?: Date;
  };
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionState,
  connectionMetrics,
  className = ''
}) => {
  const getStatusIcon = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return <Wifi className="w-4 h-4 text-green-500" />;
      case ConnectionState.CONNECTING:
      case ConnectionState.RECONNECTING:
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case ConnectionState.DISCONNECTED:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
      case ConnectionState.ERROR:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return connectionMetrics?.averageLatency 
          ? `Connected (${Math.round(connectionMetrics.averageLatency)}ms)`
          : 'Connected';
      case ConnectionState.CONNECTING:
        return 'Connecting...';
      case ConnectionState.RECONNECTING:
        return `Reconnecting... (${connectionMetrics?.totalReconnects || 0} attempts)`;
      case ConnectionState.DISCONNECTED:
        return 'Disconnected';
      case ConnectionState.ERROR:
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return 'text-green-600 bg-green-50 border-green-200';
      case ConnectionState.CONNECTING:
      case ConnectionState.RECONNECTING:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case ConnectionState.DISCONNECTED:
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case ConnectionState.ERROR:
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium transition-all ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
};

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  onRetry?: (messageId: number) => void;
  onCancel?: (messageId: number) => void;
  className?: string;
}

export const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({
  status,
  onRetry,
  onCancel,
  className = ''
}) => {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'sending':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'sent':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'delivered':
        return (
          <div className="flex">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <CheckCircle2 className="w-3 h-3 text-green-500 -ml-1" />
          </div>
        );
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'retrying':
        return <RotateCcw className="w-4 h-4 text-orange-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'failed':
        return `Failed${status.error ? `: ${status.error}` : ''}`;
      case 'retrying':
        return `Retrying... (${status.retryCount || 0})`;
      default:
        return 'Pending';
    }
  };

  const showRetryButton = status.status === 'failed' && onRetry;
  const showCancelButton = (status.status === 'sending' || status.status === 'retrying') && onCancel;

  return (
    <div className={`flex items-center space-x-2 text-xs ${className}`}>
      <div className="flex items-center space-x-1">
        {getStatusIcon()}
        <span className="text-gray-500">{getStatusText()}</span>
      </div>
      
      {status.timestamp && (
        <span className="text-gray-400">
          {status.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
      
      {showRetryButton && (
        <button
          type="button"
          onClick={() => onRetry(status.id)}
          className="inline-flex items-center space-x-1 px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      )}
      
      {showCancelButton && (
        <button
          type="button"
          onClick={() => onCancel(status.id)}
          className="inline-flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
        >
          <X className="w-3 h-3" />
          <span>Cancel</span>
        </button>
      )}
    </div>
  );
};

interface TypingIndicatorProps {
  isTyping: boolean;
  user?: string;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isTyping,
  user = 'AI Assistant',
  className = ''
}) => {
  if (!isTyping) return null;

  return (
    <div className={`flex items-center space-x-2 px-4 py-2 ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-gray-500">{user} is typing...</span>
    </div>
  );
};

interface LoadingStateProps {
  type: 'sending' | 'processing' | 'loading' | 'thinking';
  message?: string;
  progress?: number; // 0-100
  canCancel?: boolean;
  onCancel?: () => void;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type,
  message,
  progress,
  canCancel,
  onCancel,
  className = ''
}) => {
  const getLoadingIcon = () => {
    switch (type) {
      case 'sending':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-green-500 animate-spin" />;
      case 'thinking':
        return (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        );
      default:
        return <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'sending':
        return 'Sending message...';
      case 'processing':
        return 'Processing your request...';
      case 'thinking':
        return 'AI is thinking...';
      default:
        return 'Loading...';
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
      <div className="flex items-center space-x-3">
        {getLoadingIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">{message || getDefaultMessage()}</p>
          {progress !== undefined && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          )}
        </div>
      </div>
      
      {canCancel && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="ml-4 px-3 py-1 text-sm text-red-600 bg-red-100 rounded hover:bg-red-200 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
};

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  canRetry?: boolean;
  canDismiss?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = 'error',
  canRetry,
  canDismiss = true,
  onRetry,
  onDismiss,
  className = ''
}) => {
  const getErrorIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getErrorStyle = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  return (
    <div className={`p-4 border rounded-lg ${getErrorStyle()} ${className}`}>
      <div className="flex items-start">
        {getErrorIcon()}
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium mb-1">{title}</h3>}
          <p className="text-sm">{message}</p>
        </div>
        
        <div className="ml-4 flex space-x-2">
          {canRetry && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Retry
            </button>
          )}
          
          {canDismiss && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 hover:bg-white rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};