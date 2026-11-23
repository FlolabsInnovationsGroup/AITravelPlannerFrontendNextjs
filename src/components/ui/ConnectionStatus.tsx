import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  onRetry?: () => void;
}

/**
 * Connection status indicator for WebSocket connectivity
 * Provides visual feedback about real-time connection status
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting,
  onRetry
}) => {
  const handleRetry = () => {
    onRetry?.();
    toast.loading('Reconnecting...', { id: 'reconnect' });
  };

  // Always render for test purposes, but conditionally show
  return (
    <div 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-200 ${
        isConnected ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      data-testid="connection-status"
      data-connection-state={isConnected ? 'connected' : isConnecting ? 'connecting' : 'disconnected'}
    >
      <div className="bg-white border border-stone-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 max-w-sm">
        {isConnected ? (
          <>
            <Wifi className="w-5 h-5 text-green-500" />
            <span className="text-sm text-stone-700">Connected</span>
          </>
        ) : isConnecting ? (
          <>
            <div className="animate-spin">
              <Wifi className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-stone-700">Connecting...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 text-red-500" />
            <div className="flex-1">
              <div className="text-sm text-stone-700">Connection lost</div>
              <div className="text-xs text-stone-500">Real-time updates disabled</div>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={handleRetry}
                className="text-sm bg-stone-900 text-white px-3 py-1.5 rounded-md hover:bg-stone-800 transition-colors"
              >
                Retry
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;