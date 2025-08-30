import { api } from './api';
import { crewaiService } from './crewaiService';
import { PipelineRun, PipelineStage, PipelineError, PipelineFilters, PipelineResponse, JobDescription } from '../types';

// Pipeline service request/response types
export interface StartPipelineRequest {
  jobId: string;
  options?: {
    maxCandidates?: number;
    scoreThreshold?: number;
    locations?: string[];
    skills?: string[];
    experienceRange?: [number, number];
  };
}

export interface PipelineListResponse {
  pipelines: PipelineRun[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PipelineSearchParams {
  page?: number;
  limit?: number;
  status?: PipelineRun['status'][];
  jobId?: string;
  dateRange?: [Date, Date];
  sortBy?: keyof PipelineRun;
  sortOrder?: 'asc' | 'desc';
}

export interface PipelineAnalytics {
  totalRuns: number;
  successRate: number;
  averageDuration: number;
  averageCandidatesFound: number;
  stagePerformance: Array<{
    stage: PipelineStage['name'];
    averageDuration: number;
    successRate: number;
    errorRate: number;
  }>;
  errorDistribution: Array<{
    stage: string;
    errorType: string;
    count: number;
  }>;
  performanceTrends: Array<{
    date: Date;
    totalRuns: number;
    successfulRuns: number;
    averageDuration: number;
  }>;
}

// Pipeline service
export const pipelineService = {
  // Start a new pipeline with CrewAI
  startPipeline: async (request: StartPipelineRequest): Promise<PipelineRun> => {
    try {
      // For now, we'll use the job data directly with CrewAI
      // In a real implementation, you'd fetch the job from the jobs service
      const mockJob: JobDescription = {
        id: request.jobId,
        title: 'Software Engineer', // These would come from the actual job
        company: 'Tech Company',
        description: 'Looking for a skilled software engineer...',
        requirements: ['5+ years experience', 'Python', 'React'],
        location: 'San Francisco, CA',
        skills: ['Python', 'React', 'Node.js'],
        remote: true,
        salaryRange: '$120k - $180k',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Process with CrewAI
      const result = await crewaiService.processJob(mockJob);
      
      return result.pipelineRun;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to start pipeline');
    }
  },
  
  // Stop a running pipeline
  stopPipeline: async (pipelineId: string): Promise<PipelineRun> => {
    try {
      const response = await api.post<PipelineRun>(`/pipeline/${pipelineId}/stop`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to stop pipeline');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to stop pipeline');
    }
  },
  
  // Pause a running pipeline
  pausePipeline: async (pipelineId: string): Promise<PipelineRun> => {
    try {
      const response = await api.post<PipelineRun>(`/pipeline/${pipelineId}/pause`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to pause pipeline');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to pause pipeline');
    }
  },
  
  // Resume a paused pipeline
  resumePipeline: async (pipelineId: string): Promise<PipelineRun> => {
    try {
      const response = await api.post<PipelineRun>(`/pipeline/${pipelineId}/resume`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to resume pipeline');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to resume pipeline');
    }
  },
  
  // Get active pipelines
  getActivePipelines: async (): Promise<PipelineRun[]> => {
    try {
      const response = await api.get<PipelineRun[]>('/pipeline/active');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch active pipelines');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch active pipelines');
    }
  },
  
  // Get pipeline history with filtering and pagination
  getPipelineHistory: async (params: PipelineSearchParams = {}): Promise<PipelineListResponse> => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination params
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      // Add filter params
      if (params.status && params.status.length > 0) {
        queryParams.append('status', params.status.join(','));
      }
      if (params.jobId) queryParams.append('jobId', params.jobId);
      if (params.dateRange) {
        queryParams.append('startDate', params.dateRange[0].toISOString());
        queryParams.append('endDate', params.dateRange[1].toISOString());
      }
      
      // Add sorting params
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
      const response = await api.get<PipelineListResponse>(`/pipeline/history?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch pipeline history');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch pipeline history');
    }
  },
  
  // Get pipeline by ID
  getPipelineById: async (pipelineId: string): Promise<PipelineRun> => {
    try {
      const response = await api.get<PipelineRun>(`/pipeline/${pipelineId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch pipeline');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch pipeline');
    }
  },
  
  // Get pipeline status (real-time)
  getPipelineStatus: async (pipelineId: string): Promise<{
    status: PipelineRun['status'];
    currentStage: PipelineStage;
    progress: number;
    candidatesFound: number;
    errors: PipelineError[];
  }> => {
    try {
      const response = await api.get<{
        status: PipelineRun['status'];
        currentStage: PipelineStage;
        progress: number;
        candidatesFound: number;
        errors: PipelineError[];
      }>(`/pipeline/${pipelineId}/status`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch pipeline status');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch pipeline status');
    }
  },
  
  // Get pipeline logs
  getPipelineLogs: async (pipelineId: string, stage?: PipelineStage['name']): Promise<Array<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error' | 'debug';
    stage: string;
    message: string;
    details?: any;
  }>> => {
    try {
      const queryParams = new URLSearchParams();
      if (stage) queryParams.append('stage', stage);
      
      const response = await api.get<Array<{
        timestamp: Date;
        level: 'info' | 'warning' | 'error' | 'debug';
        stage: string;
        message: string;
        details?: any;
      }>>(`/pipeline/${pipelineId}/logs?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch pipeline logs');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch pipeline logs');
    }
  },
  
  // Retry a failed pipeline stage
  retryPipelineStage: async (pipelineId: string, stageName: PipelineStage['name']): Promise<PipelineRun> => {
    try {
      const response = await api.post<PipelineRun>(`/pipeline/${pipelineId}/retry/${stageName}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to retry pipeline stage');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to retry pipeline stage');
    }
  },
  
  // Get pipeline results
  getPipelineResults: async (pipelineId: string): Promise<PipelineResponse> => {
    try {
      const response = await api.get<PipelineResponse>(`/pipeline/${pipelineId}/results`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch pipeline results');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch pipeline results');
    }
  },
  
  // Get pipelines by job ID
  getPipelinesByJobId: async (jobId: string): Promise<PipelineRun[]> => {
    try {
      const response = await api.get<PipelineRun[]>(`/jobs/${jobId}/pipelines`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch pipelines for job');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch pipelines for job');
    }
  },
  
  // Delete pipeline
  deletePipeline: async (pipelineId: string): Promise<void> => {
    try {
      const response = await api.delete(`/pipeline/${pipelineId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete pipeline');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete pipeline');
    }
  },
  
  // Bulk delete pipelines
  bulkDeletePipelines: async (pipelineIds: string[]): Promise<void> => {
    try {
      const response = await api.delete('/pipeline/bulk-delete', {
        data: { pipelineIds },
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to bulk delete pipelines');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to bulk delete pipelines');
    }
  },
  
  // Get pipeline analytics
  getPipelineAnalytics: async (dateRange?: [Date, Date]): Promise<PipelineAnalytics> => {
    try {
      const queryParams = new URLSearchParams();
      if (dateRange) {
        queryParams.append('startDate', dateRange[0].toISOString());
        queryParams.append('endDate', dateRange[1].toISOString());
      }
      
      const response = await api.get<PipelineAnalytics>(`/pipeline/analytics?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch pipeline analytics');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch pipeline analytics');
    }
  },
  
  // Export pipeline data
  exportPipelineData: async (params: {
    pipelineIds?: string[];
    filters?: PipelineFilters;
    format: 'csv' | 'excel' | 'json';
    includeResults?: boolean;
    includeLogs?: boolean;
  }): Promise<void> => {
    try {
      // Use the apiClient directly for blob responses
      const { apiClient } = await import('./api');
      const response = await apiClient.post('/pipeline/export', params, {
        responseType: 'blob',
      });
      
      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pipeline-export.${params.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to export pipeline data');
    }
  },
  
  // Get pipeline configuration
  getPipelineConfig: async (): Promise<{
    maxConcurrentPipelines: number;
    defaultTimeout: number;
    retryAttempts: number;
    stages: Array<{
      name: PipelineStage['name'];
      timeout: number;
      retryable: boolean;
      description: string;
    }>;
  }> => {
    try {
      const response = await api.get<{
        maxConcurrentPipelines: number;
        defaultTimeout: number;
        retryAttempts: number;
        stages: Array<{
          name: PipelineStage['name'];
          timeout: number;
          retryable: boolean;
          description: string;
        }>;
      }>('/pipeline/config');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch pipeline configuration');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch pipeline configuration');
    }
  },
  
  // Update pipeline configuration (admin only)
  updatePipelineConfig: async (config: {
    maxConcurrentPipelines?: number;
    defaultTimeout?: number;
    retryAttempts?: number;
  }): Promise<void> => {
    try {
      const response = await api.put('/pipeline/config', config);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update pipeline configuration');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update pipeline configuration');
    }
  },
};

export default pipelineService;