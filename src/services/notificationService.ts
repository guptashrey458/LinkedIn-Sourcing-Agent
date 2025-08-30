import type { Notification as BaseNotification } from '../types';

export interface NotificationOptions {
  id?: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // in milliseconds, 0 for persistent
  actions?: NotificationAction[];
  data?: any;
  onClick?: () => void;
  onClose?: () => void;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface ExtendedNotification extends BaseNotification {
  actions?: NotificationAction[];
  data?: any;
  onClick?: () => void;
  onClose?: () => void;
}

export interface NotificationState {
  notifications: ExtendedNotification[];
  maxNotifications: number;
}

type NotificationListener = (notifications: ExtendedNotification[]) => void;

class NotificationService {
  private notifications: ExtendedNotification[] = [];
  private listeners: Set<NotificationListener> = new Set();
  private maxNotifications = 5;
  private autoRemoveTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // Configuration
  setMaxNotifications(max: number): void {
    this.maxNotifications = max;
    this.trimNotifications();
  }
  
  // Add notification
  add(options: NotificationOptions): string {
    const id = options.id || this.generateId();
    
    const notification: ExtendedNotification = {
      id,
      type: options.type,
      title: options.title,
      message: options.message,
      timestamp: new Date(),
      read: false,
      actions: options.actions,
      data: options.data,
      onClick: options.onClick,
      onClose: options.onClose
    };
    
    // Remove existing notification with same ID if it exists
    this.remove(id);
    
    // Add new notification to the beginning
    this.notifications.unshift(notification);
    
    // Trim to max notifications
    this.trimNotifications();
    
    // Set auto-remove timer if duration is specified
    const duration = options.duration !== undefined ? options.duration : this.getDefaultDuration(options.type);
    if (duration > 0) {
      this.setAutoRemoveTimer(id, duration);
    }
    
    // Notify listeners
    this.notifyListeners();
    
    // Request browser notification permission if needed
    this.requestBrowserNotification(notification);
    
    return id;
  }
  
  // Remove notification
  remove(id: string): boolean {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) return false;
    
    const notification = this.notifications[index];
    
    // Clear auto-remove timer
    this.clearAutoRemoveTimer(id);
    
    // Call onClose callback
    if (notification.onClose) {
      try {
        notification.onClose();
      } catch (error) {
        console.error('Error in notification onClose callback:', error);
      }
    }
    
    // Remove from array
    this.notifications.splice(index, 1);
    
    // Notify listeners
    this.notifyListeners();
    
    return true;
  }
  
  // Clear all notifications
  clear(): void {
    // Clear all timers
    this.autoRemoveTimers.forEach((timer, id) => {
      clearTimeout(timer);
    });
    this.autoRemoveTimers.clear();
    
    // Call onClose for all notifications
    this.notifications.forEach(notification => {
      if (notification.onClose) {
        try {
          notification.onClose();
        } catch (error) {
          console.error('Error in notification onClose callback:', error);
        }
      }
    });
    
    // Clear array
    this.notifications = [];
    
    // Notify listeners
    this.notifyListeners();
  }
  
  // Mark as read
  markAsRead(id: string): boolean {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return false;
    
    notification.read = true;
    this.notifyListeners();
    
    return true;
  }
  
  // Mark all as read
  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.notifyListeners();
  }
  
  // Get notifications
  getAll(): ExtendedNotification[] {
    return [...this.notifications];
  }
  
  getUnread(): ExtendedNotification[] {
    return this.notifications.filter(n => !n.read);
  }
  
  getById(id: string): ExtendedNotification | undefined {
    return this.notifications.find(n => n.id === id);
  }
  
  // Subscribe to changes
  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  // Convenience methods for different notification types
  success(title: string, message: string, options?: Partial<NotificationOptions>): string {
    return this.add({
      ...options,
      title,
      message,
      type: 'success'
    });
  }
  
  error(title: string, message: string, options?: Partial<NotificationOptions>): string {
    return this.add({
      ...options,
      title,
      message,
      type: 'error',
      duration: options?.duration || 0 // Errors are persistent by default
    });
  }
  
  warning(title: string, message: string, options?: Partial<NotificationOptions>): string {
    return this.add({
      ...options,
      title,
      message,
      type: 'warning'
    });
  }
  
  info(title: string, message: string, options?: Partial<NotificationOptions>): string {
    return this.add({
      ...options,
      title,
      message,
      type: 'info'
    });
  }
  
  // Pipeline-specific notifications
  pipelineStarted(pipelineId: string, jobTitle?: string): string {
    return this.info(
      'Pipeline Started',
      `Pipeline ${pipelineId.slice(0, 8)} has started${jobTitle ? ` for "${jobTitle}"` : ''}`,
      {
        data: { pipelineId, type: 'pipeline_started' },
        duration: 5000
      }
    );
  }
  
  pipelineCompleted(pipelineId: string, candidatesFound: number, jobTitle?: string): string {
    return this.success(
      'Pipeline Completed',
      `Pipeline ${pipelineId.slice(0, 8)} completed successfully. Found ${candidatesFound} candidates${jobTitle ? ` for "${jobTitle}"` : ''}`,
      {
        data: { pipelineId, candidatesFound, type: 'pipeline_completed' },
        duration: 10000
      }
    );
  }
  
  pipelineFailed(pipelineId: string, error: string, jobTitle?: string): string {
    return this.error(
      'Pipeline Failed',
      `Pipeline ${pipelineId.slice(0, 8)} failed${jobTitle ? ` for "${jobTitle}"` : ''}: ${error}`,
      {
        data: { pipelineId, error, type: 'pipeline_failed' },
        actions: [
          {
            label: 'Retry',
            action: () => {
              // This would trigger a pipeline retry
              console.log('Retry pipeline:', pipelineId);
            },
            style: 'primary'
          },
          {
            label: 'View Details',
            action: () => {
              // This would navigate to pipeline details
              console.log('View pipeline details:', pipelineId);
            },
            style: 'secondary'
          }
        ]
      }
    );
  }
  
  stageCompleted(pipelineId: string, stageName: string, duration: number): string {
    return this.info(
      'Stage Completed',
      `${stageName.charAt(0).toUpperCase() + stageName.slice(1)} stage completed in ${Math.round(duration / 1000)}s`,
      {
        data: { pipelineId, stageName, duration, type: 'stage_completed' },
        duration: 3000
      }
    );
  }
  
  stageError(pipelineId: string, stageName: string, error: string, recoverable: boolean): string {
    return this.error(
      'Stage Error',
      `Error in ${stageName} stage: ${error}`,
      {
        data: { pipelineId, stageName, error, recoverable, type: 'stage_error' },
        actions: recoverable ? [
          {
            label: 'Retry Stage',
            action: () => {
              // This would trigger a stage retry
              console.log('Retry stage:', pipelineId, stageName);
            },
            style: 'primary'
          }
        ] : undefined
      }
    );
  }
  
  // Private methods
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getDefaultDuration(type: BaseNotification['type']): number {
    switch (type) {
      case 'success': return 5000;
      case 'info': return 4000;
      case 'warning': return 6000;
      case 'error': return 0; // Persistent
      default: return 4000;
    }
  }
  
  private trimNotifications(): void {
    if (this.notifications.length > this.maxNotifications) {
      const removed = this.notifications.splice(this.maxNotifications);
      
      // Clear timers for removed notifications
      removed.forEach(notification => {
        this.clearAutoRemoveTimer(notification.id);
        if (notification.onClose) {
          try {
            notification.onClose();
          } catch (error) {
            console.error('Error in notification onClose callback:', error);
          }
        }
      });
    }
  }
  
  private setAutoRemoveTimer(id: string, duration: number): void {
    this.clearAutoRemoveTimer(id);
    
    const timer = setTimeout(() => {
      this.remove(id);
    }, duration);
    
    this.autoRemoveTimers.set(id, timer);
  }
  
  private clearAutoRemoveTimer(id: string): void {
    const timer = this.autoRemoveTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.autoRemoveTimers.delete(id);
    }
  }
  
  private notifyListeners(): void {
    const notifications = this.getAll();
    this.listeners.forEach(listener => {
      try {
        listener(notifications);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }
  
  private async requestBrowserNotification(notification: ExtendedNotification): Promise<void> {
    // Only show browser notifications for important events
    if (notification.type === 'error' || 
        (notification.data?.type && ['pipeline_completed', 'pipeline_failed'].includes(notification.data.type))) {
      
      if ('Notification' in window) {
        let permission = Notification.permission;
        
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }
        
        if (permission === 'granted') {
          const browserNotification = new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id,
            requireInteraction: notification.type === 'error'
          });
          
          browserNotification.onclick = () => {
            window.focus();
            if (notification.onClick) {
              notification.onClick();
            }
            browserNotification.close();
          };
          
          // Auto-close after 5 seconds for non-error notifications
          if (notification.type !== 'error') {
            setTimeout(() => {
              browserNotification.close();
            }, 5000);
          }
        }
      }
    }
  }
  
  // Cleanup
  destroy(): void {
    this.clear();
    this.listeners.clear();
  }
}

// Singleton instance
const notificationService = new NotificationService();

export default notificationService;