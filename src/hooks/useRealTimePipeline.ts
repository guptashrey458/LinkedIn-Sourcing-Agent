import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PipelineRun, PipelineStage, PipelineError } from '../types';
import { pipelineKeys } from './usePipeline';
import { 
  getWebSocketService, 
  createWebSocketService,
  PipelineUpdateEvent,
  StageUpdateEvent,
  ErrorEvent,
  NotificationEvent
} from '../services/websocketService';
import notificationService from '../services/notificationService';

export interface RealTimePipelineConfig {
  enabled?: boolean;
  autoConnect?: boolean;
  showNotifications?: boolean;
  debug?: boolean;
}

export interface RealTimePipelineState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

// Hook for real-time pipeline updates
export const useRealTimePipeline = (
  pipelineId?: string,
  config: RealTimePipelineConfig = {}
) => {
  const {
    enabled = true,
    autoConnect = true,
    showNotifications = true,
    debug = false
  } = config;
  
  const queryClient = useQueryClient();
  const [state, setState] = useState<RealTimePipelineState>({
    connected: false,
    connecting: false,
    error: null,
    lastUpdate: null
  });
  
  const wsService = useRef(getWebSocketService());
  const subscriptions = useRef<(() => void)[]>([]);
  
  // Initialize WebSocket service if not exists
  useEffect(() => {
    if (!wsService.current && enabled && autoConnect) {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
      wsService.current = createWebSocketService({
        url: wsUrl,
        autoConnect: true,
        reconnectAttempts: 5,
        reconnectDelay: 1000,
        debug
      });
    }
  }, [enabled, autoConnect, debug]);
  
  // Handle pipeline updates
  const handlePipelineUpdate = useCallback((event: PipelineUpdateEvent) => {
    if (debug) {
      console.log('Pipeline update received:', event);
    }
    
    // Update pipeline cache
    queryClient.setQueryData(
      pipelineKeys.detail(event.pipelineId),
      (oldData: PipelineRun | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            status: event.status,
            currentStage: event.currentStage,
            candidatesFound: event.candidatesFound,
            errors: event.errors
          };
        }
        return oldData;
      }
    );
    
    // Update pipeline status cache
    queryClient.setQueryData(
      pipelineKeys.status(event.pipelineId),
      {
        status: event.status,
        currentStage: event.currentStage,
        progress: event.progress,
        candidatesFound: event.candidatesFound,
        errors: event.errors
      }
    );
    
    // Invalidate active pipelines to refresh the list
    queryClient.invalidateQueries({ queryKey: pipelineKeys.active() });
    
    // Show notification for status changes
    if (showNotifications) {
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
    }
    
    setState(prev => ({ ...prev, lastUpdate: new Date() }));
  }, [queryClient, showNotifications, debug]);
  
  // Handle stage updates
  const handleStageUpdate = useCallback((event: StageUpdateEvent) => {
    if (debug) {
      console.log('Stage update received:', event);
    }
    
    // Update pipeline cache with new stage info
    queryClient.setQueryData(
      pipelineKeys.detail(event.pipelineId),
      (oldData: PipelineRun | undefined) => {
        if (oldData) {
          const updatedStages = oldData.stages.map(stage => 
            stage.name === event.stage.name ? event.stage : stage
          );
          
          return {
            ...oldData,
            currentStage: event.stage,
            stages: updatedStages
          };
        }
        return oldData;
      }
    );
    
    // Show notification for stage completion
    if (showNotifications && event.stage.status === 'completed') {
      const duration = event.stage.endTime && event.stage.startTime
        ? new Date(event.stage.endTime).getTime() - new Date(event.stage.startTime).getTime()
        : 0;
      
      notificationService.stageCompleted(
        event.pipelineId,
        event.stage.name,
        duration
      );
    }
    
    setState(prev => ({ ...prev, lastUpdate: new Date() }));
  }, [queryClient, showNotifications, debug]);
  
  // Handle pipeline errors
  const handlePipelineError = useCallback((event: ErrorEvent) => {
    if (debug) {
      console.log('Pipeline error received:', event);
    }
    
    // Update pipeline cache with new error
    queryClient.setQueryData(
      pipelineKeys.detail(event.pipelineId),
      (oldData: PipelineRun | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            errors: [...oldData.errors, event.error]
          };
        }
        return oldData;
      }
    );
    
    // Show error notification
    if (showNotifications) {
      notificationService.stageError(
        event.pipelineId,
        event.error.stage,
        event.error.message,
        event.error.recoverable
      );
    }
    
    setState(prev => ({ ...prev, lastUpdate: new Date() }));
  }, [queryClient, showNotifications, debug]);
  
  // Handle general notifications
  const handleNotification = useCallback((event: NotificationEvent) => {
    if (debug) {
      console.log('Notification received:', event);
    }
    
    if (showNotifications) {
      notificationService.add({
        id: event.id,
        title: event.title,
        message: event.message,
        type: event.level,
        data: { pipelineId: event.pipelineId }
      });
    }
  }, [showNotifications, debug]);
  
  // Handle connection state changes
  const handleConnectionChange = useCallback((event: any) => {
    setState(prev => ({
      ...prev,
      connected: event.connected,
      connecting: false,
      error: event.connected ? null : (event.reason || 'Connection lost')
    }));
  }, []);
  
  // Set up WebSocket subscriptions
  useEffect(() => {
    if (!wsService.current || !enabled) return;
    
    const ws = wsService.current;
    
    // Clear existing subscriptions
    subscriptions.current.forEach(unsubscribe => unsubscribe());
    subscriptions.current = [];
    
    // Subscribe to events
    subscriptions.current.push(
      ws.on('pipeline_update', handlePipelineUpdate),
      ws.on('stage_update', handleStageUpdate),
      ws.on('pipeline_error', handlePipelineError),
      ws.on('notification', handleNotification),
      ws.on('connection', handleConnectionChange)
    );
    
    // Subscribe to specific pipeline if provided
    if (pipelineId && ws.isConnected()) {
      ws.subscribeToPipeline(pipelineId);
    }
    
    // Update connection state
    setState(prev => ({
      ...prev,
      connected: ws.isConnected(),
      connecting: ws.getConnectionState() === 'connecting'
    }));
    
    return () => {
      // Unsubscribe from specific pipeline
      if (pipelineId && ws.isConnected()) {
        ws.unsubscribeFromPipeline(pipelineId);
      }
      
      // Clear subscriptions
      subscriptions.current.forEach(unsubscribe => unsubscribe());
      subscriptions.current = [];
    };
  }, [
    enabled,
    pipelineId,
    handlePipelineUpdate,
    handleStageUpdate,
    handlePipelineError,
    handleNotification,
    handleConnectionChange
  ]);
  
  // Manual connection control
  const connect = useCallback(async () => {
    if (!wsService.current) return;
    
    setState(prev => ({ ...prev, connecting: true, error: null }));
    
    try {
      await wsService.current.connect();
    } catch (error) {
      setState(prev => ({
        ...prev,
        connecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
  }, []);
  
  const disconnect = useCallback(() => {
    if (!wsService.current) return;
    
    wsService.current.disconnect();
    setState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      error: null
    }));
  }, []);
  
  return {
    ...state,
    connect,
    disconnect,
    isEnabled: enabled
  };
};

// Hook for monitoring multiple pipelines
export const useRealTimePipelineMonitoring = (
  pipelineIds: string[] = [],
  config: RealTimePipelineConfig = {}
) => {
  const {
    enabled = true,
    autoConnect = true,
    showNotifications = true,
    debug = false
  } = config;
  
  const queryClient = useQueryClient();
  const [state, setState] = useState<RealTimePipelineState>({
    connected: false,
    connecting: false,
    error: null,
    lastUpdate: null
  });
  
  const wsService = useRef(getWebSocketService());
  const subscriptions = useRef<(() => void)[]>([]);
  const subscribedPipelines = useRef<Set<string>>(new Set());
  
  // Initialize WebSocket service
  useEffect(() => {
    if (!wsService.current && enabled && autoConnect) {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
      wsService.current = createWebSocketService({
        url: wsUrl,
        autoConnect: true,
        reconnectAttempts: 5,
        reconnectDelay: 1000,
        debug
      });
    }
  }, [enabled, autoConnect, debug]);
  
  // Handle pipeline updates (same as single pipeline hook)
  const handlePipelineUpdate = useCallback((event: PipelineUpdateEvent) => {
    if (!pipelineIds.includes(event.pipelineId)) return;
    
    if (debug) {
      console.log('Pipeline update received:', event);
    }
    
    // Update caches
    queryClient.setQueryData(
      pipelineKeys.detail(event.pipelineId),
      (oldData: PipelineRun | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            status: event.status,
            currentStage: event.currentStage,
            candidatesFound: event.candidatesFound,
            errors: event.errors
          };
        }
        return oldData;
      }
    );
    
    queryClient.invalidateQueries({ queryKey: pipelineKeys.active() });
    
    if (showNotifications) {
      if (event.status === 'completed') {
        notificationService.pipelineCompleted(event.pipelineId, event.candidatesFound);
      } else if (event.status === 'failed') {
        const lastError = event.errors[event.errors.length - 1];
        notificationService.pipelineFailed(event.pipelineId, lastError?.message || 'Unknown error');
      }
    }
    
    setState(prev => ({ ...prev, lastUpdate: new Date() }));
  }, [pipelineIds, queryClient, showNotifications, debug]);
  
  // Subscribe to pipeline changes
  useEffect(() => {
    if (!wsService.current || !enabled) return;
    
    const ws = wsService.current;
    
    // Subscribe to new pipelines
    pipelineIds.forEach(pipelineId => {
      if (!subscribedPipelines.current.has(pipelineId) && ws.isConnected()) {
        ws.subscribeToPipeline(pipelineId);
        subscribedPipelines.current.add(pipelineId);
      }
    });
    
    // Unsubscribe from removed pipelines
    subscribedPipelines.current.forEach(pipelineId => {
      if (!pipelineIds.includes(pipelineId) && ws.isConnected()) {
        ws.unsubscribeFromPipeline(pipelineId);
        subscribedPipelines.current.delete(pipelineId);
      }
    });
    
    return () => {
      // Cleanup subscriptions
      subscribedPipelines.current.forEach(pipelineId => {
        if (ws.isConnected()) {
          ws.unsubscribeFromPipeline(pipelineId);
        }
      });
      subscribedPipelines.current.clear();
    };
  }, [pipelineIds, enabled]);
  
  // Set up event subscriptions (similar to single pipeline hook)
  useEffect(() => {
    if (!wsService.current || !enabled) return;
    
    const ws = wsService.current;
    
    subscriptions.current.forEach(unsubscribe => unsubscribe());
    subscriptions.current = [];
    
    subscriptions.current.push(
      ws.on('pipeline_update', handlePipelineUpdate),
      ws.on('connection', (event: any) => {
        setState(prev => ({
          ...prev,
          connected: event.connected,
          connecting: false,
          error: event.connected ? null : (event.reason || 'Connection lost')
        }));
      })
    );
    
    setState(prev => ({
      ...prev,
      connected: ws.isConnected(),
      connecting: ws.getConnectionState() === 'connecting'
    }));
    
    return () => {
      subscriptions.current.forEach(unsubscribe => unsubscribe());
      subscriptions.current = [];
    };
  }, [enabled, handlePipelineUpdate]);
  
  return {
    ...state,
    monitoredPipelines: Array.from(subscribedPipelines.current),
    isEnabled: enabled
  };
};

// Hook for job-level pipeline monitoring
export const useRealTimeJobPipelines = (
  jobId?: string,
  config: RealTimePipelineConfig = {}
) => {
  const {
    enabled = true,
    autoConnect = true,
    showNotifications = true,
    debug = false
  } = config;
  
  const wsService = useRef(getWebSocketService());
  const [state, setState] = useState<RealTimePipelineState>({
    connected: false,
    connecting: false,
    error: null,
    lastUpdate: null
  });
  
  // Initialize WebSocket service
  useEffect(() => {
    if (!wsService.current && enabled && autoConnect) {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
      wsService.current = createWebSocketService({
        url: wsUrl,
        autoConnect: true,
        reconnectAttempts: 5,
        reconnectDelay: 1000,
        debug
      });
    }
  }, [enabled, autoConnect, debug]);
  
  // Subscribe to job pipelines
  useEffect(() => {
    if (!wsService.current || !enabled || !jobId) return;
    
    const ws = wsService.current;
    
    if (ws.isConnected()) {
      ws.subscribeToJob(jobId);
    }
    
    return () => {
      if (ws.isConnected()) {
        ws.unsubscribeFromJob(jobId);
      }
    };
  }, [jobId, enabled]);
  
  return {
    ...state,
    jobId,
    isEnabled: enabled
  };
};