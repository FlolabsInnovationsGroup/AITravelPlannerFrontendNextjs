// Enhanced loading states and animations
'use client';

import React from 'react';
import { MessageSquare, Map, Loader2, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  type: 'chat' | 'map' | 'location' | 'route' | 'general';
  message?: string;
  progress?: number;
  className?: string;
}

export function LoadingState({ 
  type, 
  message, 
  progress, 
  className 
}: LoadingStateProps) {
  const getLoadingContent = () => {
    switch (type) {
      case 'chat':
        return {
          icon: MessageSquare,
          title: 'Processing your message...',
          subtitle: message || 'Our AI is thinking about your travel request',
          color: 'blue'
        };
      case 'map':
        return {
          icon: Map,
          title: 'Loading map...',
          subtitle: message || 'Preparing your interactive travel map',
          color: 'green'
        };
      case 'location':
        return {
          icon: Map,
          title: 'Finding locations...',
          subtitle: message || 'Searching for the best places to visit',
          color: 'purple'
        };
      case 'route':
        return {
          icon: Map,
          title: 'Calculating route...',
          subtitle: message || 'Finding the optimal path between locations',
          color: 'orange'
        };
      default:
        return {
          icon: Loader2,
          title: 'Loading...',
          subtitle: message || 'Please wait while we process your request',
          color: 'gray'
        };
    }
  };

  const content = getLoadingContent();
  const Icon = content.icon;

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      {/* Animated Icon */}
      <div className={cn(
        "relative mb-4 rounded-full p-4",
        {
          'bg-blue-50': content.color === 'blue',
          'bg-green-50': content.color === 'green',
          'bg-purple-50': content.color === 'purple',
          'bg-orange-50': content.color === 'orange',
          'bg-gray-50': content.color === 'gray'
        }
      )}>
        <Icon 
          size={32} 
          className={cn(
            "animate-pulse",
            {
              'text-blue-600': content.color === 'blue',
              'text-green-600': content.color === 'green',
              'text-purple-600': content.color === 'purple',
              'text-orange-600': content.color === 'orange',
              'text-gray-600': content.color === 'gray'
            }
          )}
        />
        
        {/* Spinner overlay for general loading */}
        {type === 'general' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-gray-600" />
          </div>
        )}
      </div>

      {/* Loading Text */}
      <h3 className="text-lg font-medium text-gray-800 mb-2">
        {content.title}
      </h3>
      
      <p className="text-sm text-gray-600 max-w-md">
        {content.subtitle}
      </p>

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="w-full max-w-xs mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                {
                  'bg-blue-600': content.color === 'blue',
                  'bg-green-600': content.color === 'green',
                  'bg-purple-600': content.color === 'purple',
                  'bg-orange-600': content.color === 'orange',
                  'bg-gray-600': content.color === 'gray'
                }
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Animated dots for chat typing */}
      {type === 'chat' && (
        <div className="flex space-x-1 mt-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-300" />
        </div>
      )}
    </div>
  );
}

// Skeleton Loading Components
export function MessageSkeleton() {
  return (
    <div className="flex gap-3 p-4 animate-pulse">
      <div className="w-8 h-8 bg-gray-200 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

export function LocationCardSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="flex gap-1 mt-2">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Connection Status Component
interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting?: boolean;
  lastConnected?: Date;
}

export function ConnectionStatus({ 
  isConnected, 
  isReconnecting = false, 
  lastConnected 
}: ConnectionStatusProps) {
  if (isConnected && !isReconnecting) {
    return null; // Don't show anything when connected
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-full",
      isReconnecting
        ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
        : "bg-red-50 text-red-700 border border-red-200"
    )}>
      {isReconnecting ? (
        <>
          <Loader2 size={12} className="animate-spin" />
          <span>Reconnecting...</span>
        </>
      ) : (
        <>
          <WifiOff size={12} />
          <span>Connection lost</span>
          {lastConnected && (
            <span className="text-gray-500">
              • Last seen {lastConnected.toLocaleTimeString()}
            </span>
          )}
        </>
      )}
    </div>
  );
}

// Error State Component
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  type?: 'network' | 'server' | 'validation' | 'general';
  className?: string;
}

export function ErrorState({ 
  title, 
  message, 
  onRetry, 
  type = 'general',
  className 
}: ErrorStateProps) {
  const getErrorContent = () => {
    switch (type) {
      case 'network':
        return {
          title: title || 'Connection Error',
          message: message || 'Please check your internet connection and try again.',
          actionText: 'Retry Connection'
        };
      case 'server':
        return {
          title: title || 'Server Error',
          message: message || 'Our servers are having issues. Please try again in a moment.',
          actionText: 'Try Again'
        };
      case 'validation':
        return {
          title: title || 'Invalid Input',
          message: message || 'Please check your input and try again.',
          actionText: 'Fix Input'
        };
      default:
        return {
          title: title || 'Something went wrong',
          message: message || 'An unexpected error occurred. Please try again.',
          actionText: 'Try Again'
        };
    }
  };

  const content = getErrorContent();

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle size={32} className="text-red-600" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-800 mb-2">
        {content.title}
      </h3>
      
      <p className="text-sm text-gray-600 max-w-md mb-6">
        {content.message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          {content.actionText}
        </button>
      )}
    </div>
  );
}