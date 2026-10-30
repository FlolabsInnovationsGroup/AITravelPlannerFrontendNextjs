import { useState, useEffect, useCallback } from 'react';
import { performanceMonitor, PerformanceMetrics } from '@/services/PerformanceMonitor';

export interface UsePerformanceMonitorOptions {
  /**
   * How often to update metrics (milliseconds)
   * @default 5000
   */
  updateInterval?: number;
  
  /**
   * Enable auto-refresh
   * @default true
   */
  autoRefresh?: boolean;
}

export interface UsePerformanceMonitorReturn {
  /**
   * Current performance metrics
   */
  metrics: PerformanceMetrics | null;
  
  /**
   * Record a latency measurement
   */
  recordLatency: (latency: number) => void;
  
  /**
   * Record chunk processing time
   */
  recordChunkProcessing: (processingTime: number) => void;
  
  /**
   * Record an error
   */
  recordError: (type: string, message: string) => void;
  
  /**
   * Record connection lost
   */
  recordConnectionLost: () => void;
  
  /**
   * Record reconnection
   */
  recordReconnection: (reconnectionTime: number) => void;
  
  /**
   * Record message send event
   */
  recordMessage: (success: boolean, duration?: number) => void;
  
  /**
   * Manually refresh metrics
   */
  refreshMetrics: () => void;
  
  /**
   * Reset all metrics
   */
  resetMetrics: () => void;
  
  /**
   * Export metrics as JSON
   */
  exportMetrics: () => string;
}

/**
 * Hook for monitoring streaming chat performance
 * 
 * Features:
 * - Real-time metrics tracking
 * - Auto-refresh capability
 * - Latency and error monitoring
 * - Connection health tracking
 * - Message success rates
 * 
 * @param options Configuration options
 * @returns Performance monitoring state and actions
 * 
 * @example
 * ```tsx
 * const {
 *   metrics,
 *   recordLatency,
 *   recordError
 * } = usePerformanceMonitor({ updateInterval: 3000 });
 * 
 * // Record latency
 * recordLatency(150);
 * 
 * // Display metrics
 * {metrics && (
 *   <div>Average Latency: {metrics.averageLatency}ms</div>
 * )}
 * ```
 */
export function usePerformanceMonitor({
  updateInterval = 5000,
  autoRefresh = true
}: UsePerformanceMonitorOptions = {}): UsePerformanceMonitorReturn {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  
  // Refresh metrics from the monitor
  const refreshMetrics = useCallback(() => {
    const currentMetrics = performanceMonitor.getMetrics();
    setMetrics(currentMetrics);
  }, []);
  
  // Record latency
  const recordLatency = useCallback((latency: number) => {
    performanceMonitor.recordLatency(latency);
    refreshMetrics();
  }, [refreshMetrics]);
  
  // Record chunk processing
  const recordChunkProcessing = useCallback((processingTime: number) => {
    performanceMonitor.recordChunkProcessing(processingTime);
    refreshMetrics();
  }, [refreshMetrics]);
  
  // Record error
  const recordError = useCallback((type: string, message: string) => {
    performanceMonitor.recordError(type, message);
    refreshMetrics();
  }, [refreshMetrics]);
  
  // Record connection lost
  const recordConnectionLost = useCallback(() => {
    performanceMonitor.recordConnectionLost();
    refreshMetrics();
  }, [refreshMetrics]);
  
  // Record reconnection
  const recordReconnection = useCallback((reconnectionTime: number) => {
    performanceMonitor.recordReconnection(reconnectionTime);
    refreshMetrics();
  }, [refreshMetrics]);
  
  // Record message
  const recordMessage = useCallback((success: boolean, duration?: number) => {
    performanceMonitor.recordMessage(success, duration);
    refreshMetrics();
  }, [refreshMetrics]);
  
  // Reset metrics
  const resetMetrics = useCallback(() => {
    performanceMonitor.reset();
    refreshMetrics();
  }, [refreshMetrics]);
  
  // Export metrics
  const exportMetrics = useCallback(() => {
    return performanceMonitor.exportMetrics();
  }, []);
  
  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    
    // Initial load
    refreshMetrics();
    
    // Set up interval
    const intervalId = setInterval(() => {
      refreshMetrics();
    }, updateInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [autoRefresh, updateInterval, refreshMetrics]);
  
  return {
    metrics,
    recordLatency,
    recordChunkProcessing,
    recordError,
    recordConnectionLost,
    recordReconnection,
    recordMessage,
    refreshMetrics,
    resetMetrics,
    exportMetrics
  };
}
