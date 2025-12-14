'use client';

import { useEffect } from 'react';

export default function ChunkErrorHandler() {
  useEffect(() => {
    // Handle chunk loading errors globally
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      
      // Check if it's a chunk loading error
      const isChunkError = 
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.name === 'ChunkLoadError';

      if (isChunkError) {
        event.preventDefault();
        console.warn('⚠️ Chunk loading error detected. Auto-reloading...');
        
        // Reload the page to fix the chunk error
        window.location.reload();
      }
    };

    // Listen for unhandled errors
    window.addEventListener('error', handleError);

    // Handle unhandled promise rejections (for dynamic imports)
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      
      const isChunkError = 
        reason?.message?.includes('Loading chunk') ||
        reason?.message?.includes('Failed to fetch dynamically imported module') ||
        reason?.toString().includes('ChunkLoadError');

      if (isChunkError) {
        event.preventDefault();
        console.warn('⚠️ Chunk loading error in promise. Auto-reloading...');
        window.location.reload();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null; // This component doesn't render anything
}
