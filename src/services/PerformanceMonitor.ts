/**
 * Performance Monitoring Service
 * Tracks streaming chat performance metrics, error rates, and connection health
 */

export interface PerformanceMetrics {
  // Latency metrics (milliseconds)
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  p95Latency: number;
  p99Latency: number;
  
  // Chunk processing metrics
  averageChunkProcessingTime: number;
  totalChunksProcessed: number;
  chunksPerSecond: number;
  
  // Error metrics
  totalErrors: number;
  errorRate: number; // Percentage
  errorsByType: Record<string, number>;
  
  // Connection metrics
  totalReconnections: number;
  reconnectionRate: number; // Per hour
  averageReconnectionTime: number;
  connectionUptime: number; // Percentage
  
  // Message metrics
  totalMessages: number;
  successfulMessages: number;
  failedMessages: number;
  messageSuccessRate: number; // Percentage
  
  // Timestamp
  lastUpdated: Date;
  monitoringStartTime: Date;
}

interface LatencyMeasurement {
  timestamp: number;
  latency: number;
}

interface ErrorEvent {
  timestamp: number;
  type: string;
  message: string;
}

interface ReconnectionEvent {
  timestamp: number;
  reconnectionTime: number; // How long it took to reconnect
}

interface MessageEvent {
  timestamp: number;
  success: boolean;
  duration?: number;
}

class PerformanceMonitor {
  private latencyMeasurements: LatencyMeasurement[] = [];
  private errorEvents: ErrorEvent[] = [];
  private reconnectionEvents: ReconnectionEvent[] = [];
  private messageEvents: MessageEvent[] = [];
  private chunkProcessingTimes: number[] = [];
  
  private monitoringStartTime: Date;
  private connectionStartTime: Date | null = null;
  private totalDowntime: number = 0; // Milliseconds
  
  // Configuration
  private readonly MAX_HISTORY = 1000; // Keep last 1000 measurements
  private readonly METRICS_RETENTION_HOURS = 24;
  
  constructor() {
    this.monitoringStartTime = new Date();
    this.connectionStartTime = new Date();
    this.loadPersistedMetrics();
  }
  
  /**
   * Record message send latency
   */
  recordLatency(latency: number): void {
    this.latencyMeasurements.push({
      timestamp: Date.now(),
      latency
    });
    
    this.pruneOldData();
    this.persistMetrics();
  }
  
  /**
   * Record chunk processing time
   */
  recordChunkProcessing(processingTime: number): void {
    this.chunkProcessingTimes.push(processingTime);
    
    if (this.chunkProcessingTimes.length > this.MAX_HISTORY) {
      this.chunkProcessingTimes.shift();
    }
    
    this.persistMetrics();
  }
  
  /**
   * Record an error event
   */
  recordError(type: string, message: string): void {
    this.errorEvents.push({
      timestamp: Date.now(),
      type,
      message
    });
    
    this.pruneOldData();
    this.persistMetrics();
  }
  
  /**
   * Record connection lost event
   */
  recordConnectionLost(): void {
    this.connectionStartTime = null;
  }
  
  /**
   * Record reconnection event
   */
  recordReconnection(reconnectionTime: number): void {
    this.reconnectionEvents.push({
      timestamp: Date.now(),
      reconnectionTime
    });
    
    if (this.connectionStartTime === null) {
      this.connectionStartTime = new Date();
    }
    
    this.pruneOldData();
    this.persistMetrics();
  }
  
  /**
   * Record message send event
   */
  recordMessage(success: boolean, duration?: number): void {
    this.messageEvents.push({
      timestamp: Date.now(),
      success,
      duration
    });
    
    this.pruneOldData();
    this.persistMetrics();
  }
  
  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const now = Date.now();
    const monitoringDuration = now - this.monitoringStartTime.getTime();
    
    return {
      // Latency metrics
      averageLatency: this.calculateAverage(this.latencyMeasurements.map(m => m.latency)),
      minLatency: this.calculateMin(this.latencyMeasurements.map(m => m.latency)),
      maxLatency: this.calculateMax(this.latencyMeasurements.map(m => m.latency)),
      p95Latency: this.calculatePercentile(this.latencyMeasurements.map(m => m.latency), 95),
      p99Latency: this.calculatePercentile(this.latencyMeasurements.map(m => m.latency), 99),
      
      // Chunk processing
      averageChunkProcessingTime: this.calculateAverage(this.chunkProcessingTimes),
      totalChunksProcessed: this.chunkProcessingTimes.length,
      chunksPerSecond: this.calculateRate(this.chunkProcessingTimes.length, monitoringDuration / 1000),
      
      // Error metrics
      totalErrors: this.errorEvents.length,
      errorRate: this.calculateErrorRate(),
      errorsByType: this.groupErrorsByType(),
      
      // Connection metrics
      totalReconnections: this.reconnectionEvents.length,
      reconnectionRate: this.calculateReconnectionRate(monitoringDuration),
      averageReconnectionTime: this.calculateAverage(
        this.reconnectionEvents.map(e => e.reconnectionTime)
      ),
      connectionUptime: this.calculateUptime(monitoringDuration),
      
      // Message metrics
      totalMessages: this.messageEvents.length,
      successfulMessages: this.messageEvents.filter(e => e.success).length,
      failedMessages: this.messageEvents.filter(e => !e.success).length,
      messageSuccessRate: this.calculateMessageSuccessRate(),
      
      // Timestamps
      lastUpdated: new Date(),
      monitoringStartTime: this.monitoringStartTime
    };
  }
  
  /**
   * Reset all metrics
   */
  reset(): void {
    this.latencyMeasurements = [];
    this.errorEvents = [];
    this.reconnectionEvents = [];
    this.messageEvents = [];
    this.chunkProcessingTimes = [];
    this.monitoringStartTime = new Date();
    this.connectionStartTime = new Date();
    this.totalDowntime = 0;
    
    this.clearPersistedMetrics();
  }
  
  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }
  
  // Private helper methods
  
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  private calculateMin(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.min(...values);
  }
  
  private calculateMax(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.max(...values);
  }
  
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
  
  private calculateRate(count: number, durationSeconds: number): number {
    if (durationSeconds === 0) return 0;
    return count / durationSeconds;
  }
  
  private calculateErrorRate(): number {
    const totalEvents = this.messageEvents.length + this.errorEvents.length;
    if (totalEvents === 0) return 0;
    return (this.errorEvents.length / totalEvents) * 100;
  }
  
  private groupErrorsByType(): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    this.errorEvents.forEach(event => {
      grouped[event.type] = (grouped[event.type] || 0) + 1;
    });
    
    return grouped;
  }
  
  private calculateReconnectionRate(monitoringDurationMs: number): number {
    const monitoringHours = monitoringDurationMs / (1000 * 60 * 60);
    if (monitoringHours === 0) return 0;
    return this.reconnectionEvents.length / monitoringHours;
  }
  
  private calculateUptime(monitoringDurationMs: number): number {
    if (monitoringDurationMs === 0) return 100;
    const uptime = monitoringDurationMs - this.totalDowntime;
    return (uptime / monitoringDurationMs) * 100;
  }
  
  private calculateMessageSuccessRate(): number {
    if (this.messageEvents.length === 0) return 0;
    const successful = this.messageEvents.filter(e => e.success).length;
    return (successful / this.messageEvents.length) * 100;
  }
  
  private pruneOldData(): void {
    const cutoff = Date.now() - (this.METRICS_RETENTION_HOURS * 60 * 60 * 1000);
    
    this.latencyMeasurements = this.latencyMeasurements.filter(
      m => m.timestamp > cutoff
    );
    
    this.errorEvents = this.errorEvents.filter(
      e => e.timestamp > cutoff
    );
    
    this.reconnectionEvents = this.reconnectionEvents.filter(
      e => e.timestamp > cutoff
    );
    
    this.messageEvents = this.messageEvents.filter(
      e => e.timestamp > cutoff
    );
  }
  
  private persistMetrics(): void {
    try {
      const data = {
        latencyMeasurements: this.latencyMeasurements,
        errorEvents: this.errorEvents,
        reconnectionEvents: this.reconnectionEvents,
        messageEvents: this.messageEvents,
        chunkProcessingTimes: this.chunkProcessingTimes,
        monitoringStartTime: this.monitoringStartTime.toISOString(),
        totalDowntime: this.totalDowntime
      };
      
      localStorage.setItem('performance_metrics', JSON.stringify(data));
    } catch (error) {
      // Silently fail if localStorage is unavailable
      console.warn('Failed to persist performance metrics:', error);
    }
  }
  
  private loadPersistedMetrics(): void {
    try {
      const stored = localStorage.getItem('performance_metrics');
      if (!stored) return;
      
      const data = JSON.parse(stored);
      
      this.latencyMeasurements = data.latencyMeasurements || [];
      this.errorEvents = data.errorEvents || [];
      this.reconnectionEvents = data.reconnectionEvents || [];
      this.messageEvents = data.messageEvents || [];
      this.chunkProcessingTimes = data.chunkProcessingTimes || [];
      this.monitoringStartTime = new Date(data.monitoringStartTime || Date.now());
      this.totalDowntime = data.totalDowntime || 0;
      
      this.pruneOldData();
    } catch (error) {
      console.warn('Failed to load persisted metrics:', error);
    }
  }
  
  private clearPersistedMetrics(): void {
    try {
      localStorage.removeItem('performance_metrics');
    } catch (error) {
      console.warn('Failed to clear persisted metrics:', error);
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
