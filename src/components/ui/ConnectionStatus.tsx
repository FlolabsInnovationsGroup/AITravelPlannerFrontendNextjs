import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
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
  if (isConnected) {
    return null; // Don't show anything when connected
  }

  const handleRetry = () => {
    onRetry?.();
    toast.loading('Reconnecting...', { id: 'reconnect' });
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 max-w-sm">
        {isConnecting ? (
          <>
            <div className="animate-spin">
              <Wifi className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm text-gray-700">Connecting...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 text-red-500" />
            <div className="flex-1">
              <div className="text-sm text-gray-700">Connection lost</div>
              <div className="text-xs text-gray-500">Real-time updates disabled</div>
            </div>
            {onRetry && (
              <button
                onClick={handleRetry}
                className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
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