// Multi-client subscription manager using Server-Sent Events
export class MultiClientSubscriptionManager {
  private eventSource: EventSource | null = null;
  private listeners = new Set<(data: any) => void>();
  private boardId: string | null = null;
  private clientId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor() {
    // Generate unique client ID
    this.clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });
    }
  }

  subscribe(boardId: string, listener: (data: any) => void) {
    this.listeners.add(listener);

    // If this is the first listener or board changed, connect
    if (!this.eventSource || this.boardId !== boardId) {
      this.connect(boardId);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
      
      // If no more listeners, disconnect
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  private connect(boardId: string) {
    // Disconnect existing connection if any
    this.disconnect();

    this.boardId = boardId;
    console.log(`🔌 Connecting to multi-client sync for board: ${boardId}`);

    if (typeof window === 'undefined') return;

    try {
      // Create EventSource connection
      this.eventSource = new EventSource(`/api/subscribe/${boardId}`);

      this.eventSource.onopen = () => {
        console.log('✅ Multi-client sync connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Clear any pending reconnect
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 Received multi-client update:', data);

          // Don't process our own updates
          if (data.clientId === this.clientId) {
            return;
          }

          // Notify all listeners
          this.listeners.forEach(listener => {
            try {
              listener(data);
            } catch (error) {
              console.error('Error in subscription listener:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('❌ Multi-client sync error:', error);
        this.isConnected = false;
        
        // Attempt to reconnect
        this.attemptReconnect();
      };

    } catch (error) {
      console.error('Failed to create EventSource:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimeout) {
      return; // Already attempting to reconnect
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.boardId) {
        this.connect(this.boardId);
      }
    }, delay);
  }

  private disconnect() {
    console.log('🔌 Disconnecting multi-client sync');
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.boardId = null;
  }

  // Public method to force disconnect (for debugging/cleanup)
  public forceDisconnect() {
    this.disconnect();
  }

  // Public method to force reconnection
  public forceReconnect(boardId: string) {
    console.log('🔄 Force reconnecting to board:', boardId);
    this.disconnect();
    this.connect(boardId);
  }

  // Broadcast an update to other clients
  async broadcastUpdate(boardId: string, type: string, data: any) {
    if (typeof window === 'undefined') return;

    try {
      console.log(`📤 Broadcasting ${type} update:`, data);
      
      const response = await fetch(`/api/boards/${boardId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.clientId,
        },
        body: JSON.stringify({
          type,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to broadcast update: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Update broadcasted to ${result.connectedClients || 0} clients`);
      
    } catch (error) {
      console.error('Failed to broadcast update:', error);
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      boardId: this.boardId,
      clientId: this.clientId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Global instance
export const multiClientSubscriptionManager = new MultiClientSubscriptionManager();
