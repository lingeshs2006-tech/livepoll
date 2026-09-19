class WebSocketManager {
  constructor() {
    this.ws = null;
    this.pollId = null;
    this.onMessageCallback = null;
    this.onStatusChangeCallback = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(pollId) {
    if (this.ws) {
      this.disconnect();
    }
    
    this.pollId = pollId;
    this.updateStatus('connecting');
    
    try {
      // Use relative path for Vite proxy
      const wsUrl = `/ws/polls/${pollId}`;

      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log(`Connected to poll ${pollId}`);
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.updateStatus('connected');
      };
      
      this.ws.onmessage = (event) => {
        if (this.onMessageCallback) {
          try {
            const data = JSON.parse(event.data);
            this.onMessageCallback(data);
          } catch (e) {
            console.error("Failed to parse websocket message", e);
          }
        }
      };
      
      this.ws.onclose = () => {
        this.updateStatus('disconnected');
        this.attemptReconnect();
      };
      
      this.ws.onerror = (err) => {
        console.error("WebSocket error", err);
        this.ws.close();
      };
    } catch (e) {
      console.error("Failed to establish websocket connection", e);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.updateStatus('reconnecting');
      console.log(`Reconnecting in ${this.reconnectDelay}ms... (Attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        if (this.pollId) {
          this.connect(this.pollId);
        }
      }, this.reconnectDelay);
      
      // Exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
    } else {
      this.updateStatus('failed');
      console.error("Max reconnect attempts reached");
    }
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }
  
  onStatusChange(callback) {
    this.onStatusChangeCallback = callback;
  }
  
  updateStatus(status) {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }

  disconnect() {
    this.pollId = null;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default new WebSocketManager();
