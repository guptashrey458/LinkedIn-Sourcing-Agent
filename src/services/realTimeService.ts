import { createWebSocketService, getWebSocketService } from './websocketService';
import notificationService from './notificationService';

class RealTimeService {
  private initialized = false;
  
  // Initialize real-time services
  initialize(): void {
    if (this.initialized) return;
    
    try {
      // Get WebSocket URL from environment
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
      
      // Create WebSocket service
      const wsService = createWebSocketService({
        url: wsUrl,
        autoConnect: true,
        reconnectAttempts: 5,
        reconnectDelay: 1000,
        debug: import.meta.env.VITE_ENVIRONMENT === 'development'
      });
      
      // Set up global event handlers
      this.setupGlobalEventHandlers(wsService);
      
      this.initialized = true;
      
      console.log('Real-time services initialized');
    } catch (error) {
      console.error('Failed to initialize real-time services:', error);
    }
  }
  
  // Set up global event handlers
  private setupGlobalEventHandlers(wsService: any): void {
    // Connection status notifications
    wsService.on('connection', (event: any) => {
      if (event.connected) {
        notificationService.success(
          'Connected',
          'Real-time updates are now active',
          { duration: 3000 }
        );
      } else {
        notificationService.warning(
          'Connection Lost',
          'Real-time updates are temporarily unavailable',
          { duration: 5000 }
        );
      }
    });
    
    // Global error handling
    wsService.on('error', (event: any) => {
      notificationService.error(
        'Connection Error',
        'Failed to connect to real-time services',
        { duration: 0 } // Persistent
      );
    });
    
    // Pipeline completion notifications
    wsService.on('pipeline_update', (event: any) => {
      if (event.status === 'completed') {
        notificationService.pipelineCompleted(
          event.pipelineId,
          event.candidatesFound
        );
      } else if (event.status === 'failed') {
        const lastError = event.errors[event.errors.length - 1];
        notificationService.pipelineFailed(
          event.pipelineId,
          lastError?.message || 'Unknown error'
        );
      }
    });
    
    // Stage completion notifications
    wsService.on('stage_update', (event: any) => {
      if (event.stage.status === 'completed') {
        const duration = event.stage.endTime && event.stage.startTime
          ? new Date(event.stage.endTime).getTime() - new Date(event.stage.startTime).getTime()
          : 0;
        
        notificationService.stageCompleted(
          event.pipelineId,
          event.stage.name,
          duration
        );
      }
    });
    
    // Pipeline error notifications
    wsService.on('pipeline_error', (event: any) => {
      notificationService.stageError(
        event.pipelineId,
        event.error.stage,
        event.error.message,
        event.error.recoverable
      );
    });
    
    // General notifications from server
    wsService.on('notification', (event: any) => {
      notificationService.add({
        id: event.id,
        title: event.title,
        message: event.message,
        type: event.level,
        data: { pipelineId: event.pipelineId }
      });
    });
  }
  
  // Get WebSocket service instance
  getWebSocketService() {
    return getWebSocketService();
  }
  
  // Check if services are initialized
  isInitialized(): boolean {
    return this.initialized;
  }
  
  // Cleanup
  destroy(): void {
    const wsService = getWebSocketService();
    if (wsService) {
      wsService.destroy();
    }
    
    notificationService.destroy();
    this.initialized = false;
  }
}

// Singleton instance
const realTimeService = new RealTimeService();

export default realTimeService;