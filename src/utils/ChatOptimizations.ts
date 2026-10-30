/* eslint-disable max-classes-per-file */
/**
 * Enhanced chat performance optimizations for better user experience
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';

// Message batching for better WebSocket performance
export class MessageBatcher {
    private batchQueue: any[] = [];

    private batchTimeout: NodeJS.Timeout | null = null;

    private readonly batchDelay = 100; // 100ms batch window

    private readonly maxBatchSize = 10;

    constructor(private sendBatch: (messages: any[]) => void) {}

    addMessage(message: any) {
        this.batchQueue.push(message);

        // Send immediately if batch is full
        if (this.batchQueue.length >= this.maxBatchSize) {
            this.flush();
            return;
        }

        // Schedule batch send if not already scheduled
        if (!this.batchTimeout) {
            this.batchTimeout = setTimeout(() => {
                this.flush();
            }, this.batchDelay);
        }
    }

    private flush() {
        if (this.batchQueue.length === 0) return;

        const batch = [...this.batchQueue];
        this.batchQueue = [];
        
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }

        this.sendBatch(batch);
    }

    destroy() {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }
        this.batchQueue = [];
    }
}

// Virtual scrolling for large chat histories
export const useChatVirtualization = (messages: any[], containerHeight: number) => {
    const [scrollTop, setScrollTop] = useState(0);
    const itemHeight = 100; // Estimated height per message
    const overscan = 5; // Extra items to render outside viewport

    const visibleItems = useMemo(() => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(
            messages.length - 1,
            Math.ceil((scrollTop + containerHeight) / itemHeight)
        );

        return {
            startIndex: Math.max(0, startIndex - overscan),
            endIndex: Math.min(messages.length - 1, endIndex + overscan),
            visibleMessages: messages.slice(
                Math.max(0, startIndex - overscan),
                Math.min(messages.length, endIndex + overscan + 1)
            )
        };
    }, [messages, scrollTop, containerHeight]);

    return {
        ...visibleItems,
        handleScroll: useCallback((event: React.UIEvent<HTMLDivElement>) => {
            setScrollTop(event.currentTarget.scrollTop);
        }, []),
        totalHeight: messages.length * itemHeight
    };
};

// Optimized typing indicator
export const useTypingIndicator = (isTyping: boolean, delay: number = 300) => {
    const [showIndicator, setShowIndicator] = useState(false);
    // const timeoutRef = useRef<NodeJS.Timeout>();

    const debouncedSetTyping = useMemo(
        () => debounce((typing: boolean) => {
            setShowIndicator(typing);
        }, delay),
        [delay]
    );

    useEffect(() => {
        debouncedSetTyping(isTyping);
        
        return () => {
            debouncedSetTyping.cancel();
        };
    }, [isTyping, debouncedSetTyping]);

    return showIndicator;
};

// Message deduplication
export class MessageDeduplicator {
    private recentMessages = new Set<string>();

    private readonly maxRecentMessages = 100;

    private readonly messageTtl = 30000; // 30 seconds

    addMessage(messageId: string, content: string): boolean {
        const key = `${messageId}:${content}`;
        
        if (this.recentMessages.has(key)) {
            return false; // Duplicate detected
        }

        this.recentMessages.add(key);

        // Clean up old messages
        if (this.recentMessages.size > this.maxRecentMessages) {
            this.cleanup();
        }

        // Set expiry for message
        setTimeout(() => {
            this.recentMessages.delete(key);
        }, this.messageTtl);

        return true; // New message
    }

    private cleanup() {
        // Simple cleanup: clear half of the messages
        const messages = Array.from(this.recentMessages);
        messages.slice(0, Math.floor(messages.length / 2)).forEach(msg => {
            this.recentMessages.delete(msg);
        });
    }
}

// Connection quality monitoring
export class ConnectionQualityMonitor {
    private latencyHistory: number[] = [];

    private readonly maxHistoryLength = 10;
    
    recordLatency(latency: number) {
        this.latencyHistory.push(latency);
        
        if (this.latencyHistory.length > this.maxHistoryLength) {
            this.latencyHistory.shift();
        }
    }

    getAverageLatency(): number {
        if (this.latencyHistory.length === 0) return 0;
        
        return this.latencyHistory.reduce((sum, lat) => sum + lat, 0) / this.latencyHistory.length;
    }

    getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
        const avgLatency = this.getAverageLatency();
        
        if (avgLatency < 100) return 'excellent';
        if (avgLatency < 300) return 'good';
        if (avgLatency < 600) return 'fair';
        return 'poor';
    }

    getQualityColor(): string {
        const quality = this.getConnectionQuality();
        
        switch (quality) {
            case 'excellent': return '#22c55e'; // green
            case 'good': return '#84cc16'; // lime
            case 'fair': return '#f59e0b'; // amber
            case 'poor': return '#ef4444'; // red
            default: return '#6b7280'; // gray fallback
        }
    }
}
