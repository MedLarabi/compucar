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

// Global connection tracking to prevent multiple connections in Firefox
const globalConnectionTracker = {
  activeConnection: null as EventSource | null,
  connectionPromise: null as Promise<EventSource> | null,
  isConnecting: false,
  userId: null as string | null
};

export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions = {}) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const isFirefox = useRef<boolean>(false);
  const visibilityChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionCleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const componentId = useRef<string>(Math.random().toString(36).substr(2, 9));

  // Detect Firefox browser and setup visibility handling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      isFirefox.current = navigator.userAgent.toLowerCase().includes('firefox');
      console.log('📡 Browser detection:', isFirefox.current ? 'Firefox' : 'Other');
      
      // Firefox-specific page visibility handling
      if (isFirefox.current) {
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden') {
            console.log('📡 Firefox: Page hidden, scheduling connection cleanup');
            visibilityChangeTimeoutRef.current = setTimeout(() => {
              if (document.visibilityState === 'hidden') {
                console.log('📡 Firefox: Cleaning up SSE due to page visibility');
                forceDisconnect();
              }
            }, 5000); // Wait 5 seconds before cleanup
          } else if (document.visibilityState === 'visible') {
            console.log('📡 Firefox: Page visible, canceling cleanup and reconnecting');
            if (visibilityChangeTimeoutRef.current) {
              clearTimeout(visibilityChangeTimeoutRef.current);
              visibilityChangeTimeoutRef.current = null;
            }
            // Reconnect after a short delay
            setTimeout(() => {
              if (session?.user && (!eventSourceRef.current || eventSourceRef.current.readyState !== EventSource.OPEN)) {
                connect();
              }
            }, 1000);
          }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          if (visibilityChangeTimeoutRef.current) {
            clearTimeout(visibilityChangeTimeoutRef.current);
          }
        };
      }
    }
  }, []);

  const forceDisconnect = () => {
    console.log(`📡 [${componentId.current}] Force disconnecting SSE...`);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (connectionCleanupTimeoutRef.current) {
      clearTimeout(connectionCleanupTimeoutRef.current);
      connectionCleanupTimeoutRef.current = null;
    }

    // Firefox-specific: Force clear global connection
    if (isFirefox.current) {
      console.log(`📡 [${componentId.current}] Firefox: Force clearing global connection`);
      globalConnectionTracker.activeConnection = null;
      globalConnectionTracker.isConnecting = false;
      globalConnectionTracker.connectionPromise = null;
      globalConnectionTracker.userId = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
  };

  const connect = () => {
    if (!session?.user) {
      console.log('📡 No session, skipping SSE connection');
      return;
    }

    const currentUserId = session.user.id;
    console.log(`📡 [${componentId.current}] Connect request for user: ${currentUserId}`);

    // Firefox-specific: Check for existing global connection
    if (isFirefox.current) {
      // If there's already an active connection for this user, reuse it
      if (globalConnectionTracker.activeConnection && 
          globalConnectionTracker.userId === currentUserId &&
          globalConnectionTracker.activeConnection.readyState === EventSource.OPEN) {
        console.log(`📡 [${componentId.current}] Firefox: Reusing existing global connection`);
        eventSourceRef.current = globalConnectionTracker.activeConnection;
        setIsConnected(true);
        setReconnectAttempts(0);
        return;
      }

      // If connection is in progress, wait for it
      if (globalConnectionTracker.isConnecting && globalConnectionTracker.connectionPromise) {
        console.log(`📡 [${componentId.current}] Firefox: Connection in progress, waiting...`);
        globalConnectionTracker.connectionPromise.then((eventSource) => {
          if (eventSource && eventSource.readyState === EventSource.OPEN) {
            eventSourceRef.current = eventSource;
            setIsConnected(true);
            setReconnectAttempts(0);
          }
        }).catch((error) => {
          console.error(`📡 [${componentId.current}] Firefox: Failed to reuse connection:`, error);
        });
        return;
      }
    }

    // Regular connection check for all browsers
    if (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.OPEN) {
      console.log(`📡 [${componentId.current}] SSE already connected and open`);
      return;
    }

    // Clean up any existing connection with Firefox-specific handling
    if (eventSourceRef.current) {
      console.log(`📡 [${componentId.current}] Cleaning up existing connection...`);
      eventSourceRef.current.close();
      
      // Firefox needs extra time to properly close connections
      if (isFirefox.current) {
        connectionCleanupTimeoutRef.current = setTimeout(() => {
          eventSourceRef.current = null;
          actualConnect();
        }, 200);
        return;
      } else {
        eventSourceRef.current = null;
      }
    }

    actualConnect();
  };

  const actualConnect = () => {
    const currentUserId = session?.user?.id;
    if (!currentUserId) return;

    console.log(`📡 [${componentId.current}] Actually connecting to SSE...`);
    
    // Firefox-specific: Set connecting state
    if (isFirefox.current) {
      globalConnectionTracker.isConnecting = true;
      globalConnectionTracker.userId = currentUserId;
    }
    
    try {
      const connectionPromise = new Promise<EventSource>((resolve, reject) => {
        const eventSource = new EventSource('/api/sse');
        
        eventSource.onopen = () => {
          console.log(`📡 [${componentId.current}] SSE connected`);
          setIsConnected(true);
          setReconnectAttempts(0);
          
          // Firefox-specific: Update global tracker
          if (isFirefox.current) {
            globalConnectionTracker.activeConnection = eventSource;
            globalConnectionTracker.isConnecting = false;
            globalConnectionTracker.connectionPromise = null;
          }
          
          options.onConnection?.();
          resolve(eventSource);
        };

        eventSource.onmessage = (event) => {
          try {
            const data: SSEMessage = JSON.parse(event.data);
            console.log(`📡 [${componentId.current}] Received SSE message:`, data);
            
            setLastMessage(data);

            // Handle different message types
            switch (data.type) {
              case 'connection':
                console.log(`📡 [${componentId.current}] Connection established:`, data.message);
                break;
                
              case 'heartbeat':
                // Firefox heartbeat - just log and continue
                console.log(`📡 [${componentId.current}] Heartbeat received`);
                break;
                
              case 'file_status_update':
                console.log(`📡 [${componentId.current}] File status update:`, data);
                options.onFileStatusUpdate?.(data);
                break;
                
              case 'estimated_time_update':
                console.log(`📡 [${componentId.current}] Estimated time update:`, data);
                options.onEstimatedTimeUpdate?.(data);
                break;
                
              default:
                console.log(`📡 [${componentId.current}] Unknown message type:`, data.type);
            }
          } catch (error) {
            console.error(`📡 [${componentId.current}] Error parsing SSE message:`, error);
          }
        };

        eventSource.onerror = (error) => {
          console.error(`📡 [${componentId.current}] SSE error:`, error);
          setIsConnected(false);
          
          // Firefox-specific: Clear global tracker
          if (isFirefox.current) {
            globalConnectionTracker.activeConnection = null;
            globalConnectionTracker.isConnecting = false;
            globalConnectionTracker.connectionPromise = null;
            globalConnectionTracker.userId = null;
          }
          
          // Close current connection
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }

          // Firefox-specific error handling
          if (isFirefox.current) {
            // Check if page is hidden - if so, don't reconnect
            if (document.visibilityState === 'hidden') {
              console.log(`📡 [${componentId.current}] Firefox: Page hidden, skipping reconnect`);
              reject(new Error('Page hidden'));
              return;
            }
            
            // Limit reconnection attempts for Firefox
            if (reconnectAttempts >= 5) {
              console.log(`📡 [${componentId.current}] Firefox: Max reconnection attempts reached`);
              reject(new Error('Max reconnection attempts reached'));
              return;
            }
          }

          // Attempt to reconnect with exponential backoff
          const baseDelay = isFirefox.current ? 2000 : 1000; // Longer delay for Firefox
          const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts), 30000); // Max 30 seconds
          console.log(`📡 [${componentId.current}] Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);

          options.onError?.(new Error('SSE connection error'));
          reject(error);
        };
        
        eventSourceRef.current = eventSource;
      });
      
      // Firefox-specific: Store connection promise
      if (isFirefox.current) {
        globalConnectionTracker.connectionPromise = connectionPromise;
      }

    } catch (error) {
      console.error(`📡 [${componentId.current}] Error creating SSE connection:`, error);
      
      // Firefox-specific: Clear connecting state
      if (isFirefox.current) {
        globalConnectionTracker.isConnecting = false;
        globalConnectionTracker.connectionPromise = null;
      }
      
      options.onError?.(error as Error);
    }
  };

  const disconnect = () => {
    console.log(`📡 [${componentId.current}] Disconnecting SSE...`);
    
    // Clear all timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (visibilityChangeTimeoutRef.current) {
      clearTimeout(visibilityChangeTimeoutRef.current);
      visibilityChangeTimeoutRef.current = null;
    }
    
    if (connectionCleanupTimeoutRef.current) {
      clearTimeout(connectionCleanupTimeoutRef.current);
      connectionCleanupTimeoutRef.current = null;
    }

    // Firefox-specific: Only close global connection if this is the last component
    if (isFirefox.current && eventSourceRef.current === globalConnectionTracker.activeConnection) {
      console.log(`📡 [${componentId.current}] Firefox: Closing global connection`);
      
      // Clear global tracker
      globalConnectionTracker.activeConnection = null;
      globalConnectionTracker.isConnecting = false;
      globalConnectionTracker.connectionPromise = null;
      globalConnectionTracker.userId = null;
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        setTimeout(() => {
          eventSourceRef.current = null;
        }, 100);
      }
    } else if (!isFirefox.current && eventSourceRef.current) {
      // Non-Firefox: Normal cleanup
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    } else if (isFirefox.current) {
      // Firefox: Just clear local reference, don't close global connection
      console.log(`📡 [${componentId.current}] Firefox: Clearing local reference, keeping global connection`);
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
