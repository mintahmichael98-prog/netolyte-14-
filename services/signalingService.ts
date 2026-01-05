import { SignalingMessage } from '../types';

// NOTE: In a real production environment, this would be a WebSocket connection 
// to a Node.js/Socket.io server.
// For this frontend-only demo, we use BroadcastChannel to allow communication
// between different tabs/windows of the same browser. This effectively simulates
// a real signaling server for local testing.

class SignalingService {
  private channel: BroadcastChannel;
  private userId: string | null = null;
  private onMessageCallbacks: ((msg: SignalingMessage) => void)[] = [];

  constructor() {
    // Channel Name acts as the "Room"
    this.channel = new BroadcastChannel('leadgenius_signaling');
    
    this.channel.onmessage = (event) => {
      const msg = event.data as SignalingMessage;
      
      // Logic to route messages
      // 1. Direct messages to this user
      // 2. Group messages (prefixed with group_) - simulate broadcast
      if (msg.to === this.userId || msg.to.startsWith('group_')) {
        this.onMessageCallbacks.forEach(cb => cb(msg));
      }
      
      // Also process broadcast messages (like status updates if we implemented a public feed)
      // or 'chat:typing' if we want a general listener
    };
  }

  public identify(userId: string) {
    this.userId = userId;
    console.log(`[Signaling] Identified as ${userId}`);
  }

  public send(message: SignalingMessage) {
    // In a real WS, we'd send to server. Here we broadcast.
    console.debug(`[Signaling] Sending ${message.type} to ${message.to}`);
    this.channel.postMessage(message);
  }

  public onMessage(callback: (msg: SignalingMessage) => void) {
    this.onMessageCallbacks.push(callback);
  }
  
  public removeMessageListener(callback: (msg: SignalingMessage) => void) {
    this.onMessageCallbacks = this.onMessageCallbacks.filter(cb => cb !== callback);
  }
  
  public cleanup() {
    this.onMessageCallbacks = [];
    // Don't close channel as it might be reused in single page app logic
  }
}

export const signalingService = new SignalingService();