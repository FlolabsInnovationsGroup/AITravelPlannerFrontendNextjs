import { useState, useEffect } from 'react';

interface UseOnlineStatusOptions {
  onOnline?: () => void;
  onOffline?: () => void;
}

interface UseOnlineStatusResult {
  isOnline: boolean;
  wasOffline: boolean;
}

export const useOnlineStatus = (options: UseOnlineStatusOptions = {}): UseOnlineStatusResult => {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? window.navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        console.log('🌐 Connection restored');
        options.onOnline?.();
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      console.log('📵 Connection lost');
      options.onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, options]);

  return { isOnline, wasOffline };
};

export default useOnlineStatus;
