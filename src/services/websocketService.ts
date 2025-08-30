import { io, Socket } from 'socket.io-client';
import { PipelineRun, PipelineStage, PipelineError } from '../types';

// WebSocket event types
export interface PipelineUpdateEvent {
  type: 'pipeline_update';
  pipelineId: string;
  status: PipelineRun['status'];
  currentStage: PipelineStage;
  progress: number;
  candidatesFound: number;
  errors: PipelineError[];
  timestamp: Date;
}

export interface StageUpdateEvent {
  type: 'stage_update';
  pipelineId: string;
  stage: PipelineStage;
  timestamp: Date;
}

export interface ErrorEvent {
  type: 'pipeline_error';
  pipelineId: string;
  error: PipelineError;
  timestamp: Date;
}

export interface NotificationEvent {
  type: 'notification';
  id: string;
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  pipelineId?: string;
  timestamp: Date;
}

export type WebSocketEvent = 
  | PipelineUpdateEvent 
  | StageUpdateEvent 
  | ErrorEvent 
  | NotificationEvent;

// Event handlers
export type EventHandler<T = WebSocketEvent> = (event: T) => void;

export interface WebSocketServiceConfig {
  url: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  debug?: boolean;
}

class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketServiceConfig;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  constructor(config: WebSocketServiceConfig) {
    this.config = {
      autoConnect: true,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      debug: false,
      ...config
    };
    
    this.maxReconnectAttempts = config.reconnectAttempts || 5;
    this.reconnectDelay = config.reconnectDelay || 1000;
    
    if (config.autoConnect) {
      this.connect();
    }
  }
  
  // Connection management
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }
      
      this.connectionState = 'connecting';
      this.log('Connecting to WebSocket server...');
      
      this.socket = io(this.config.url, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });
      
      // Connection events
      this.socket.on('connect', () => {
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.log('Connected to WebSocket server');
        resolve();
        
        // Emit connection event
        this.emit('connection', { type: 'connection', connected: true });
      });
      
      this.socket.on('disconnect', (reason) => {
        this.connectionState = 'disconnected';
        this.log(`Disconnected from WebSocket server: ${reason}`);
        
        // Emit disconnection event
        this.emit('connection', { type: 'connection', connected: false, reason });
        
        // Auto-reconnect if not manually disconnected
        if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      });
      
      this.socket.on('connect_error', (error) => {
        this.connectionState = 'error';
        this.log(`Connection error: ${error.message}`);
        
        if (this.reconnectAttempts === 0) {
          reject(error);
        }
        
        // Schedule reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      });
      
      // Pipeline events
      this.socket.on('pipeline_update', (data: PipelineUpdateEvent) => {
        this.log('Received pipeline update:', data);
        this.emit('pipeline_update', data);
      });
      
      this.socket.on('stage_update', (data: StageUpdateEvent) => {
        this.log('Received stage update:', data);
        this.emit('stage_update', data);
      });
      
      this.socket.on('pipeline_error', (data: ErrorEvent) => {
        this.log('Received pipeline error:', data);
        this.emit('pipeline_error', data);
      });
      
      this.socket.on('notification', (data: NotificationEvent) => {
        this.log('Received notification:', data);
        this.emit('notification', data);
      });
      
      // Generic event handler for custom events
      this.socket.onAny((eventName: string, data: any) => {
        if (!['connect', 'disconnect', 'connect_error', 'pipeline_update', 'stage_update', 'pipeline_error', 'notification'].includes(eventName)) {
          this.log(`Received custom event: ${eventName}`, data);
          this.emit(eventName, data);
        }
      });
    });
  }
  
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connectionState = 'disconnected';
    this.log('Manually disconnected from WebSocket server');
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    this.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.log(`Reconnect attempt ${this.reconnectAttempts} failed:`, error);
      });
    }, delay);
  }
  
  // Event subscription
  on<T extends WebSocketEvent = WebSocketEvent>(
    eventType: string, 
    handler: EventHandler<T>
  ): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    
    this.eventHandlers.get(eventType)!.add(handler as EventHandler);
    
    // Return unsubscribe function
    return () => {
      this.off(eventType, handler);
    };
  }
  
  off<T extends WebSocketEvent = WebSocketEvent>(
    eventType: string, 
    handler: EventHandler<T>
  ): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType);
      }
    }
  }
  
  private emit(eventType: string, data: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          this.log(`Error in event handler for ${eventType}:`, error);
        }
      });
    }
  }
  
  // Pipeline-specific methods
  subscribeToPipeline(pipelineId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_pipeline', { pipelineId });
      this.log(`Subscribed to pipeline: ${pipelineId}`);
    }
  }
  
  unsubscribeFromPipeline(pipelineId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe_pipeline', { pipelineId });
      this.log(`Unsubscribed from pipeline: ${pipelineId}`);
    }
  }
  
  subscribeToJob(jobId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_job', { jobId });
      this.log(`Subscribed to job: ${jobId}`);
    }
  }
  
  unsubscribeFromJob(jobId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe_job', { jobId });
      this.log(`Unsubscribed from job: ${jobId}`);
    }
  }
  
  // Send custom events
  send(eventType: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(eventType, data);
      this.log(`Sent event: ${eventType}`, data);
    } else {
      this.log(`Cannot send event ${eventType}: not connected`);
    }
  }
  
  // Status methods
  isConnected(): boolean {
    return this.connectionState === 'connected' && this.socket?.connected === true;
  }
  
  getConnectionState(): string {
    return this.connectionState;
  }
  
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
  
  // Utility methods
  private log(message: string, data?: any): void {
    if (this.config.debug) {
      if (data) {
        console.log(`[WebSocket] ${message}`, data);
      } else {
        console.log(`[WebSocket] ${message}`);
      }
    }
  }
  
  // Cleanup
  destroy(): void {
    this.disconnect();
    this.eventHandlers.clear();
  }
}

// Singleton instance
let websocketService: WebSocketService | null = null;

export const createWebSocketService = (config: WebSocketServiceConfig): WebSocketService => {
  if (websocketService) {
    websocketService.destroy();
  }
  
  websocketService = new WebSocketService(config);
  return websocketService;
};

export const getWebSocketService = (): WebSocketService | null => {
  return websocketService;
};

export default WebSocketService;