import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface SSEMessage {
  type: string;
  message?: string;
  fileId?: string;
  fileName?: string;
  oldStatus?: string;
  newStatus?: string;
  estimatedTime?: number;
  timeText?: string;
  status?: string;
  timestamp: string;
}

interface UseRealTimeUpdatesOptions {
  onFileStatusUpdate?: (data: SSEMessage) => void;
  onEstimatedTimeUpdate?: (data: SSEMessage) => void;
  onConnection?: () => void;
  onError?: (error: Error) => void;
}

export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions = {}) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = () => {
    if (!session?.user) {
      console.log('📡 No session, skipping SSE connection');
      return;
    }

    if (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.OPEN) {
      console.log('📡 SSE already connected and open');
      return;
    }

    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    console.log('📡 Connecting to SSE...');
    
    try {
      const eventSource = new EventSource('/api/sse');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('📡 SSE connected');
        setIsConnected(true);
        setReconnectAttempts(0);
        options.onConnection?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEMessage = JSON.parse(event.data);
          console.log('📡 Received SSE message:', data);
          
          setLastMessage(data);

          // Handle different message types
          switch (data.type) {
            case 'connection':
              console.log('📡 Connection established:', data.message);
              break;
              
            case 'file_status_update':
              console.log('📡 File status update:', data);
              options.onFileStatusUpdate?.(data);
              break;
              
            case 'estimated_time_update':
              console.log('📡 Estimated time update:', data);
              options.onEstimatedTimeUpdate?.(data);
              break;
              
            default:
              console.log('📡 Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('📡 Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('📡 SSE error:', error);
        setIsConnected(false);
        
        // Close current connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // Attempt to reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Max 30 seconds
        console.log(`📡 Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, delay);

        options.onError?.(new Error('SSE connection error'));
      };

    } catch (error) {
      console.error('📡 Error creating SSE connection:', error);
      options.onError?.(error as Error);
    }
  };

  const disconnect = () => {
    console.log('📡 Disconnecting SSE...');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setReconnectAttempts(0);
  };

  useEffect(() => {
    if (session?.user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [session?.user?.id]); // Only reconnect if user ID changes, not on every session change

  return {
    isConnected,
    lastMessage,
    reconnectAttempts,
    connect,
    disconnect
  };
}
