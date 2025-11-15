import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

interface ConnectionOptions {
  maxReconnectAttempts?: number;
  baseReconnectDelay?: number;
  maxReconnectDelay?: number;
  backoffFactor?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  enableHeartbeat?: boolean;
}

interface ConnectionMetrics {
  connectionAttempts: number;
  lastConnectedAt?: Date;
  lastDisconnectedAt?: Date;
  totalReconnects: number;
  averageLatency?: number;
}

interface WebSocketMessage {
  type: string;
  payload?: any;
  sessionId?: string;
  timestamp?: number;
}

interface UseEnhancedWebSocketResult {
  connectionState: ConnectionState;
  connectionMetrics: ConnectionMetrics;
  connect: (sessionId: string) => void;
  disconnect: () => void;
  sendMessage: (message: WebSocketMessage) => boolean;
  addMessageHandler: (handler: (message: any) => void) => () => void;
  setErrorHandler: (handler: (error: any) => void) => void;
  setConnectionHandler: (handler: (state: ConnectionState) => void) => void;
}

const defaultOptions: Required<ConnectionOptions> = {
  maxReconnectAttempts: 10,
  baseReconnectDelay: 1000,
  maxReconnectDelay: 30000,
  backoffFactor: 1.5,
  heartbeatInterval: 25000,
  heartbeatTimeout: 10000,
  enableHeartbeat: true
};

export const useEnhancedWebSocket = (
  baseUrl: string,
  options: ConnectionOptions = {}
): UseEnhancedWebSocketResult => {
  const opts = { ...defaultOptions, ...options };
  
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>({
    connectionAttempts: 0,
    totalReconnects: 0
  });

  // Refs for managing connection lifecycle
  const clientRef = useRef<any>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isIntentionalDisconnectRef = useRef(false);
  const messageHandlersRef = useRef<Set<(message: any) => void>>(new Set());
  const errorHandlerRef = useRef<((error: any) => void) | null>(null);
  const connectionHandlerRef = useRef<((state: ConnectionState) => void) | null>(null);
  const latencyMeasurementRef = useRef<{ pingStart?: number; samples: number[] }>({
    samples: []
  });

  const calculateReconnectDelay = useCallback((attempt: number): number => {
    const delay = opts.baseReconnectDelay * Math.pow(opts.backoffFactor, attempt);
    return Math.min(delay, opts.maxReconnectDelay);
  }, [opts.baseReconnectDelay, opts.maxReconnectDelay, opts.backoffFactor]);

  const updateConnectionState = useCallback((newState: ConnectionState) => {
    setConnectionState(newState);
    connectionHandlerRef.current?.(newState);
    
    if (newState === ConnectionState.CONNECTED) {
      setConnectionMetrics(prev => ({
        ...prev,
        lastConnectedAt: new Date(),
        connectionAttempts: prev.connectionAttempts + 1
      }));
    } else if (newState === ConnectionState.DISCONNECTED) {
      setConnectionMetrics(prev => ({
        ...prev,
        lastDisconnectedAt: new Date()
      }));
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    if (!opts.enableHeartbeat || !clientRef.current) return;

    const sendPing = () => {
      if (clientRef.current && connectionState === ConnectionState.CONNECTED) {
        try {
          latencyMeasurementRef.current.pingStart = Date.now();
          
          // Send heartbeat message
          clientRef.current.publish({
            destination: '/app/heartbeat',
            body: JSON.stringify({ 
              type: 'ping', 
              timestamp: Date.now(),
              sessionId: currentSessionIdRef.current 
            })
          });

          // Set timeout for pong response
          heartbeatTimeoutRef.current = setTimeout(() => {
            console.warn('⚠️ Heartbeat timeout - connection may be lost');
            if (clientRef.current) {
              clientRef.current.forceDisconnect();
            }
          }, opts.heartbeatTimeout);

        } catch (error) {
          console.error('❌ Error sending heartbeat:', error);
        }
      }
    };

    // Initial ping after connection stabilizes
    setTimeout(sendPing, 1000);
    
    // Regular heartbeat interval
    heartbeatIntervalRef.current = setInterval(sendPing, opts.heartbeatInterval);
  }, [connectionState, opts.enableHeartbeat, opts.heartbeatInterval, opts.heartbeatTimeout]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  const handleMessage = useCallback((message: any) => {
    try {
      // Handle heartbeat pong
      if (message.body) {
        const parsedBody = JSON.parse(message.body);
        if (parsedBody.type === 'pong' && latencyMeasurementRef.current.pingStart) {
          const latency = Date.now() - latencyMeasurementRef.current.pingStart;
          latencyMeasurementRef.current.samples.push(latency);
          
          // Keep only last 10 samples for average calculation
          if (latencyMeasurementRef.current.samples.length > 10) {
            latencyMeasurementRef.current.samples.shift();
          }
          
          const averageLatency = latencyMeasurementRef.current.samples.reduce((a, b) => a + b, 0) / latencyMeasurementRef.current.samples.length;
          
          setConnectionMetrics(prev => ({ ...prev, averageLatency }));
          
          if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current);
            heartbeatTimeoutRef.current = null;
          }
          
          return; // Don't forward heartbeat messages to handlers
        }
      }

      // Forward message to all registered handlers
      messageHandlersRef.current.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('❌ Error in message handler:', error);
        }
      });
    } catch (error) {
      console.error('❌ Error processing WebSocket message:', error);
    }
  }, []);

  const attemptReconnect = useCallback(() => {
    if (isIntentionalDisconnectRef.current || !currentSessionIdRef.current) {
      return;
    }

    if (reconnectAttemptRef.current >= opts.maxReconnectAttempts) {
      console.error('🚫 Max reconnection attempts reached');
      updateConnectionState(ConnectionState.ERROR);
      toast.error('Connection failed. Please refresh the page.');
      return;
    }

    const delay = calculateReconnectDelay(reconnectAttemptRef.current);
    reconnectAttemptRef.current += 1;

    updateConnectionState(ConnectionState.RECONNECTING);
    
    setConnectionMetrics(prev => ({
      ...prev,
      totalReconnects: prev.totalReconnects + 1
    }));

    toast.loading(`Reconnecting... (attempt ${reconnectAttemptRef.current}/${opts.maxReconnectAttempts})`, {
      duration: delay,
      id: 'websocket-reconnect'
    });

    reconnectTimeoutRef.current = setTimeout(() => {
      if (currentSessionIdRef.current && !isIntentionalDisconnectRef.current) {
        connect(currentSessionIdRef.current);
      }
    }, delay);
  }, [opts.maxReconnectAttempts, calculateReconnectDelay, updateConnectionState]);

  const connect = useCallback((sessionId: string) => {
    // Prevent multiple concurrent connections
    if (connectionState === ConnectionState.CONNECTING) {
      return;
    }

    // Clean up any existing connection
    if (clientRef.current) {
      try {
        clientRef.current.deactivate();
      } catch (error) {
        console.warn('⚠️ Error deactivating existing WebSocket:', error);
      }
    }

    currentSessionIdRef.current = sessionId;
    isIntentionalDisconnectRef.current = false;
    updateConnectionState(ConnectionState.CONNECTING);

    try {
      // Dynamic import to avoid SSR issues
      import('@stomp/stompjs').then(({ Client }) => {
        import('sockjs-client').then((SockJS) => {
          const client = new Client({
            webSocketFactory: () => new (SockJS.default || SockJS)(`${baseUrl}/ws`),
            connectHeaders: {
              Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('guestToken')}`
            },
            debug: (str) => {
              if (process.env.NODE_ENV === 'development') {
                console.log('🔌 STOMP Debug:', str);
              }
            },
            onConnect: () => {
              console.log('✅ WebSocket connected for session:', sessionId);
              reconnectAttemptRef.current = 0;
              updateConnectionState(ConnectionState.CONNECTED);
              toast.dismiss('websocket-reconnect');
              toast.success('Connected successfully!', { duration: 2000, id: 'websocket-connect' });

              // Subscribe to session-specific topics
              try {
                client.subscribe(`/topic/locations/${sessionId}`, handleMessage);
                client.subscribe(`/user/queue/errors`, handleMessage);
                client.subscribe(`/user/queue/notifications`, handleMessage);
                
                console.log('📡 Subscribed to WebSocket topics for session:', sessionId);
                startHeartbeat();
              } catch (error) {
                console.error('❌ Error subscribing to topics:', error);
                errorHandlerRef.current?.(error);
              }
            },
            onDisconnect: () => {
              console.log('🔌 WebSocket disconnected');
              stopHeartbeat();
              updateConnectionState(ConnectionState.DISCONNECTED);
              toast.dismiss('websocket-connect');
              toast.dismiss('websocket-reconnect');

              if (!isIntentionalDisconnectRef.current) {
                setTimeout(attemptReconnect, 100);
              }
            },
            onStompError: (frame) => {
              console.error('❌ STOMP Error:', frame.headers['message'], frame.body);
              const error = new Error(frame.headers['message'] || 'WebSocket connection error');
              errorHandlerRef.current?.(error);
              updateConnectionState(ConnectionState.ERROR);
              
              if (!isIntentionalDisconnectRef.current) {
                setTimeout(attemptReconnect, 1000);
              }
            },
            onWebSocketError: (error) => {
              console.error('❌ WebSocket Error:', error);
              errorHandlerRef.current?.(error);
              updateConnectionState(ConnectionState.ERROR);
              
              if (!isIntentionalDisconnectRef.current) {
                setTimeout(attemptReconnect, 1000);
              }
            }
          });

          clientRef.current = client;
          client.activate();
        });
      });
    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error);
      errorHandlerRef.current?.(error);
      updateConnectionState(ConnectionState.ERROR);
      setTimeout(attemptReconnect, 1000);
    }
  }, [connectionState, baseUrl, handleMessage, startHeartbeat, stopHeartbeat, attemptReconnect, updateConnectionState]);

  const disconnect = useCallback(() => {
    isIntentionalDisconnectRef.current = true;
    currentSessionIdRef.current = null;
    
    // Clear reconnection timer
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopHeartbeat();

    if (clientRef.current) {
      try {
        clientRef.current.deactivate();
      } catch (error) {
        console.warn('⚠️ Error during WebSocket disconnect:', error);
      }
    }

    updateConnectionState(ConnectionState.DISCONNECTED);
    toast.dismiss('websocket-connect');
    toast.dismiss('websocket-reconnect');
  }, [stopHeartbeat, updateConnectionState]);

  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
    if (!clientRef.current || connectionState !== ConnectionState.CONNECTED) {
      console.warn('⚠️ Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      const messageWithTimestamp = {
        ...message,
        timestamp: Date.now(),
        sessionId: currentSessionIdRef.current
      };

      clientRef.current.publish({
        destination: '/app/message',
        body: JSON.stringify(messageWithTimestamp)
      });

      return true;
    } catch (error) {
      console.error('❌ Error sending WebSocket message:', error);
      errorHandlerRef.current?.(error);
      return false;
    }
  }, [connectionState]);

  const addMessageHandler = useCallback((handler: (message: any) => void) => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  const setErrorHandler = useCallback((handler: (error: any) => void) => {
    errorHandlerRef.current = handler;
  }, []);

  const setConnectionHandler = useCallback((handler: (state: ConnectionState) => void) => {
    connectionHandlerRef.current = handler;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionState,
    connectionMetrics,
    connect,
    disconnect,
    sendMessage,
    addMessageHandler,
    setErrorHandler,
    setConnectionHandler
  };
};