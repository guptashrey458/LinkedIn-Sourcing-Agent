import React from 'react';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { pipelineService } from '../services/queryClient';
import { PipelineRun, PipelineFilters } from '../types';
import type { 
  StartPipelineRequest, 
  PipelineSearchParams 
} from '../services/pipelineService';

// Query keys
export const pipelineKeys = {
  all: ['pipeline'] as const,
  active: () => [...pipelineKeys.all, 'active'] as const,
  history: () => [...pipelineKeys.all, 'history'] as const,
  historyList: (params: PipelineSearchParams) => [...pipelineKeys.history(), params] as const,
  details: () => [...pipelineKeys.all, 'detail'] as const,
  detail: (id: string) => [...pipelineKeys.details(), id] as const,
  status: (id: string) => [...pipelineKeys.detail(id), 'status'] as const,
  logs: (id: string, stage?: string) => [...pipelineKeys.detail(id), 'logs', stage] as const,
  results: (id: string) => [...pipelineKeys.detail(id), 'results'] as const,
  byJob: (jobId: string) => [...pipelineKeys.all, 'byJob', jobId] as const,
  analytics: (dateRange?: [Date, Date]) => [...pipelineKeys.all, 'analytics', dateRange] as const,
  config: () => [...pipelineKeys.all, 'config'] as const,
};

// Active pipelines hook with real-time updates
export const useActivePipelines = (refetchInterval?: number) => {
  return useQuery({
    queryKey: pipelineKeys.active(),
    queryFn: () => pipelineService.getActivePipelines(),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: refetchInterval || 5000, // 5 seconds default
    refetchIntervalInBackground: true,
  });
};

// Pipeline history hook
export const usePipelineHistory = (params: PipelineSearchParams = {}) => {
  return useQuery({
    queryKey: pipelineKeys.historyList(params),
    queryFn: () => pipelineService.getPipelineHistory(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Single pipeline hook
export const usePipeline = (pipelineId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: pipelineKeys.detail(pipelineId),
    queryFn: () => pipelineService.getPipelineById(pipelineId),
    enabled: enabled && Boolean(pipelineId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Pipeline status hook with real-time updates
export const usePipelineStatus = (pipelineId: string, enabled: boolean = true, refetchInterval?: number) => {
  return useQuery({
    queryKey: pipelineKeys.status(pipelineId),
    queryFn: () => pipelineService.getPipelineStatus(pipelineId),
    enabled: enabled && Boolean(pipelineId),
    staleTime: 1000 * 10, // 10 seconds
    refetchInterval: refetchInterval || 2000, // 2 seconds default
    refetchIntervalInBackground: true,
  });
};

// Pipeline logs hook
export const usePipelineLogs = (pipelineId: string, stage?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: pipelineKeys.logs(pipelineId, stage),
    queryFn: () => pipelineService.getPipelineLogs(pipelineId, stage as any),
    enabled: enabled && Boolean(pipelineId),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 3000, // 3 seconds
  });
};

// Pipeline results hook
export const usePipelineResults = (pipelineId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: pipelineKeys.results(pipelineId),
    queryFn: () => pipelineService.getPipelineResults(pipelineId),
    enabled: enabled && Boolean(pipelineId),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Pipelines by job hook
export const usePipelinesByJob = (jobId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: pipelineKeys.byJob(jobId),
    queryFn: () => pipelineService.getPipelinesByJobId(jobId),
    enabled: enabled && Boolean(jobId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Pipeline analytics hook
export const usePipelineAnalytics = (dateRange?: [Date, Date]) => {
  return useQuery({
    queryKey: pipelineKeys.analytics(dateRange),
    queryFn: () => pipelineService.getPipelineAnalytics(dateRange),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Pipeline configuration hook
export const usePipelineConfig = () => {
  return useQuery({
    queryKey: pipelineKeys.config(),
    queryFn: () => pipelineService.getPipelineConfig(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Start pipeline mutation
export const useStartPipeline = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: StartPipelineRequest) => pipelineService.startPipeline(request),
    onSuccess: (newPipeline) => {
      // Add to active pipelines
      queryClient.setQueryData(pipelineKeys.detail(newPipeline.id), newPipeline);
      
      // Invalidate active pipelines to refresh the list
      queryClient.invalidateQueries({ queryKey: pipelineKeys.active() });
      
      // Invalidate pipelines by job
      queryClient.invalidateQueries({ queryKey: pipelineKeys.byJob(newPipeline.jobId) });
      
      // Invalidate analytics
      queryClient.invalidateQueries({ queryKey: pipelineKeys.analytics() });
    },
  });
};

// Stop pipeline mutation
export const useStopPipeline = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (pipelineId: string) => pipelineService.stopPipeline(pipelineId),
    onSuccess: (updatedPipeline) => {
      // Update pipeline in cache
      queryClient.setQueryData(pipelineKeys.detail(updatedPipeline.id), updatedPipeline);
      
      // Invalidate active pipelines
      queryClient.invalidateQueries({ queryKey: pipelineKeys.active() });
      
      // Invalidate history
      queryClient.invalidateQueries({ queryKey: pipelineKeys.history() });
      
      // Invalidate analytics
      queryClient.invalidateQueries({ queryKey: pipelineKeys.analytics() });
    },
  });
};

// Pause pipeline mutation
export const usePausePipeline = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (pipelineId: string) => pipelineService.pausePipeline(pipelineId),
    onSuccess: (updatedPipeline) => {
      // Update pipeline in cache
      queryClient.setQueryData(pipelineKeys.detail(updatedPipeline.id), updatedPipeline);
      
      // Invalidate active pipelines
      queryClient.invalidateQueries({ queryKey: pipelineKeys.active() });
    },
  });
};

// Resume pipeline mutation
export const useResumePipeline = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (pipelineId: string) => pipelineService.resumePipeline(pipelineId),
    onSuccess: (updatedPipeline) => {
      // Update pipeline in cache
      queryClient.setQueryData(pipelineKeys.detail(updatedPipeline.id), updatedPipeline);
      
      // Invalidate active pipelines
      queryClient.invalidateQueries({ queryKey: pipelineKeys.active() });
    },
  });
};

// Retry pipeline stage mutation
export const useRetryPipelineStage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ pipelineId, stageName }: { pipelineId: string; stageName: string }) => 
      pipelineService.retryPipelineStage(pipelineId, stageName as any),
    onSuccess: (updatedPipeline) => {
      // Update pipeline in cache
      queryClient.setQueryData(pipelineKeys.detail(updatedPipeline.id), updatedPipeline);
      
      // Invalidate active pipelines
      queryClient.invalidateQueries({ queryKey: pipelineKeys.active() });
      
      // Invalidate logs
      queryClient.invalidateQueries({ queryKey: pipelineKeys.logs(updatedPipeline.id) });
    },
  });
};

// Delete pipeline mutation
export const useDeletePipeline = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (pipelineId: string) => pipelineService.deletePipeline(pipelineId),
    onSuccess: (_, pipelineId) => {
      // Remove pipeline from cache
      queryClient.removeQueries({ queryKey: pipelineKeys.detail(pipelineId) });
      
      // Invalidate history
      queryClient.invalidateQueries({ queryKey: pipelineKeys.history() });
      
      // Invalidate analytics
      queryClient.invalidateQueries({ queryKey: pipelineKeys.analytics() });
    },
  });
};

// Bulk delete pipelines mutation
export const useBulkDeletePipelines = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (pipelineIds: string[]) => pipelineService.bulkDeletePipelines(pipelineIds),
    onSuccess: (_, pipelineIds) => {
      // Remove pipelines from cache
      pipelineIds.forEach(pipelineId => {
        queryClient.removeQueries({ queryKey: pipelineKeys.detail(pipelineId) });
      });
      
      // Invalidate history
      queryClient.invalidateQueries({ queryKey: pipelineKeys.history() });
      
      // Invalidate analytics
      queryClient.invalidateQueries({ queryKey: pipelineKeys.analytics() });
    },
  });
};

// Update pipeline configuration mutation (admin only)
export const useUpdatePipelineConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (config: {
      maxConcurrentPipelines?: number;
      defaultTimeout?: number;
      retryAttempts?: number;
    }) => pipelineService.updatePipelineConfig(config),
    onSuccess: () => {
      // Invalidate config
      queryClient.invalidateQueries({ queryKey: pipelineKeys.config() });
    },
  });
};

// Export pipeline data mutation
export const useExportPipelineData = () => {
  return useMutation({
    mutationFn: (params: {
      pipelineIds?: string[];
      filters?: PipelineFilters;
      format: 'csv' | 'excel' | 'json';
      includeResults?: boolean;
      includeLogs?: boolean;
    }) => pipelineService.exportPipelineData(params),
  });
};

// Real-time pipeline updates hook
export const useRealTimePipelineUpdates = (pipelineId: string, enabled: boolean = true) => {
  const queryClient = useQueryClient();
  
  // This would typically use WebSocket or Server-Sent Events
  // For now, we'll use polling with a shorter interval
  const { data: status } = usePipelineStatus(pipelineId, enabled, 1000); // 1 second polling
  
  // Update pipeline data when status changes
  React.useEffect(() => {
    if (status && enabled) {
      // Update the pipeline cache with new status
      queryClient.setQueryData(pipelineKeys.detail(pipelineId), (oldData: PipelineRun | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            status: status.status,
            currentStage: status.currentStage,
            candidatesFound: status.candidatesFound,
            errors: status.errors,
          };
        }
        return oldData;
      });
    }
  }, [status, pipelineId, enabled, queryClient]);
  
  return status;
};

// Pipeline monitoring hook for multiple pipelines
export const usePipelineMonitoring = (pipelineIds: string[], enabled: boolean = true) => {
  const queryClient = useQueryClient();
  
  // Monitor multiple pipelines
  const queries = pipelineIds.map(pipelineId => ({
    queryKey: pipelineKeys.status(pipelineId),
    queryFn: () => pipelineService.getPipelineStatus(pipelineId),
    enabled: enabled && Boolean(pipelineId),
    staleTime: 1000 * 5, // 5 seconds
    refetchInterval: 2000, // 2 seconds
  }));
  
  return useQueries({ queries });
};