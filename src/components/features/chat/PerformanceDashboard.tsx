import React from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Activity, TrendingUp, AlertCircle, Wifi, Download } from 'lucide-react';

export interface PerformanceDashboardProps {
  /**
   * Update interval in milliseconds
   * @default 5000
   */
  updateInterval?: number;
  
  /**
   * Compact mode for sidebar display
   * @default false
   */
  compact?: boolean;
}

/**
 * Performance monitoring dashboard for streaming chat
 * Displays real-time metrics including latency, errors, and connection health
 * 
 * @example
 * ```tsx
 * <PerformanceDashboard updateInterval={3000} compact={false} />
 * ```
 */
export function PerformanceDashboard({
  updateInterval = 5000,
  compact = false
}: PerformanceDashboardProps) {
  const {
    metrics,
    resetMetrics,
    exportMetrics
  } = usePerformanceMonitor({ updateInterval });
  
  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-500">
        <Activity className="w-4 h-4 mr-2 animate-pulse" />
        <span>Loading metrics...</span>
      </div>
    );
  }
  
  const handleExport = () => {
    const json = exportMetrics();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  if (compact) {
    return (
      <div className="space-y-2 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <Activity className="w-4 h-4" />
            Performance
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <MetricCard
            label="Avg Latency"
            value={`${metrics.averageLatency.toFixed(0)}ms`}
            color={metrics.averageLatency > 1000 ? 'red' : 'green'}
            compact
          />
          <MetricCard
            label="Success Rate"
            value={`${metrics.messageSuccessRate.toFixed(1)}%`}
            color={metrics.messageSuccessRate > 95 ? 'green' : 'yellow'}
            compact
          />
          <MetricCard
            label="Uptime"
            value={`${metrics.connectionUptime.toFixed(1)}%`}
            color={metrics.connectionUptime > 99 ? 'green' : 'yellow'}
            compact
          />
          <MetricCard
            label="Errors"
            value={metrics.totalErrors.toString()}
            color={metrics.totalErrors === 0 ? 'green' : 'red'}
            compact
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          Performance Dashboard
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Export metrics"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={resetMetrics}
            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      
      {/* Latency Metrics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          Latency
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard
            label="Average"
            value={`${metrics.averageLatency.toFixed(0)}ms`}
            color={metrics.averageLatency > 1000 ? 'red' : 'green'}
          />
          <MetricCard
            label="Min"
            value={`${metrics.minLatency.toFixed(0)}ms`}
            color="green"
          />
          <MetricCard
            label="Max"
            value={`${metrics.maxLatency.toFixed(0)}ms`}
            color="blue"
          />
          <MetricCard
            label="P95"
            value={`${metrics.p95Latency.toFixed(0)}ms`}
            color="blue"
          />
          <MetricCard
            label="P99"
            value={`${metrics.p99Latency.toFixed(0)}ms`}
            color="yellow"
          />
        </div>
      </div>
      
      {/* Chunk Processing */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Chunk Processing
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MetricCard
            label="Avg Processing Time"
            value={`${metrics.averageChunkProcessingTime.toFixed(2)}ms`}
            color="green"
          />
          <MetricCard
            label="Total Chunks"
            value={metrics.totalChunksProcessed.toString()}
            color="blue"
          />
          <MetricCard
            label="Chunks/sec"
            value={metrics.chunksPerSecond.toFixed(2)}
            color="green"
          />
        </div>
      </div>
      
      {/* Error Metrics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          Errors
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MetricCard
            label="Total Errors"
            value={metrics.totalErrors.toString()}
            color={metrics.totalErrors === 0 ? 'green' : 'red'}
          />
          <MetricCard
            label="Error Rate"
            value={`${metrics.errorRate.toFixed(2)}%`}
            color={metrics.errorRate < 1 ? 'green' : 'red'}
          />
          <div className="col-span-2 md:col-span-1">
            <div className="text-xs text-gray-600 mb-1">Errors by Type</div>
            <div className="space-y-1">
              {Object.entries(metrics.errorsByType).length === 0 ? (
                <div className="text-xs text-green-600">No errors</div>
              ) : (
                Object.entries(metrics.errorsByType).map(([type, count]) => (
                  <div key={type} className="text-xs text-gray-700">
                    {type}: {count}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Connection Metrics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
          <Wifi className="w-4 h-4" />
          Connection
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Uptime"
            value={`${metrics.connectionUptime.toFixed(2)}%`}
            color={metrics.connectionUptime > 99 ? 'green' : 'yellow'}
          />
          <MetricCard
            label="Reconnections"
            value={metrics.totalReconnections.toString()}
            color={metrics.totalReconnections === 0 ? 'green' : 'yellow'}
          />
          <MetricCard
            label="Reconnection Rate"
            value={`${metrics.reconnectionRate.toFixed(2)}/hr`}
            color="blue"
          />
          <MetricCard
            label="Avg Reconnection Time"
            value={`${metrics.averageReconnectionTime.toFixed(0)}ms`}
            color="blue"
          />
        </div>
      </div>
      
      {/* Message Metrics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Messages
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Total"
            value={metrics.totalMessages.toString()}
            color="blue"
          />
          <MetricCard
            label="Successful"
            value={metrics.successfulMessages.toString()}
            color="green"
          />
          <MetricCard
            label="Failed"
            value={metrics.failedMessages.toString()}
            color={metrics.failedMessages === 0 ? 'green' : 'red'}
          />
          <MetricCard
            label="Success Rate"
            value={`${metrics.messageSuccessRate.toFixed(2)}%`}
            color={metrics.messageSuccessRate > 95 ? 'green' : 'yellow'}
          />
        </div>
      </div>
      
      {/* Footer */}
      <div className="text-xs text-gray-500 border-t border-gray-200 pt-3">
        <div>
          Monitoring started: {metrics.monitoringStartTime.toLocaleString()}
        </div>
        <div>
          Last updated: {metrics.lastUpdated.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  color: 'green' | 'yellow' | 'red' | 'blue';
  compact?: boolean;
}

function MetricCard({ label, value, color, compact = false }: MetricCardProps) {
  const colorClasses = {
    green: 'text-green-700 bg-green-50 border-green-200',
    yellow: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    red: 'text-red-700 bg-red-50 border-red-200',
    blue: 'text-blue-700 bg-blue-50 border-blue-200'
  };
  
  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 mb-1`}>
        {label}
      </div>
      <div className={`${compact ? 'text-sm' : 'text-lg'} font-semibold`}>
        {value}
      </div>
    </div>
  );
}
