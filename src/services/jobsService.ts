import { api } from './api';
import { JobDescription, JobTemplate, JobFilters, ApiResponse } from '../types';

// Jobs service request/response types
export interface CreateJobRequest extends Omit<JobDescription, 'id' | 'createdAt' | 'updatedAt'> {}

export interface UpdateJobRequest extends Partial<Omit<JobDescription, 'id' | 'createdAt' | 'updatedAt'>> {}

export interface JobsListResponse {
  jobs: JobDescription[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CreateJobTemplateRequest extends Omit<JobTemplate, 'id' | 'createdAt'> {}

export interface JobSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: JobDescription['status'][];
  location?: string[];
  skills?: string[];
  dateRange?: [Date, Date];
  sortBy?: keyof JobDescription;
  sortOrder?: 'asc' | 'desc';
}

// Jobs service
export const jobsService = {
  // Get all jobs with filtering and pagination
  getJobs: async (params: JobSearchParams = {}): Promise<JobsListResponse> => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination params
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      // Add search params
      if (params.search) queryParams.append('search', params.search);
      
      // Add filter params
      if (params.status && params.status.length > 0) {
        queryParams.append('status', params.status.join(','));
      }
      if (params.location && params.location.length > 0) {
        queryParams.append('location', params.location.join(','));
      }
      if (params.skills && params.skills.length > 0) {
        queryParams.append('skills', params.skills.join(','));
      }
      if (params.dateRange) {
        queryParams.append('startDate', params.dateRange[0].toISOString());
        queryParams.append('endDate', params.dateRange[1].toISOString());
      }
      
      // Add sorting params
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
      const response = await api.get<JobsListResponse>(`/jobs?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch jobs');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch jobs');
    }
  },
  
  // Get job by ID
  getJobById: async (jobId: string): Promise<JobDescription> => {
    try {
      const response = await api.get<JobDescription>(`/jobs/${jobId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch job');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch job');
    }
  },
  
  // Create new job
  createJob: async (jobData: CreateJobRequest): Promise<JobDescription> => {
    try {
      const response = await api.post<JobDescription>('/jobs', jobData);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create job');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create job');
    }
  },
  
  // Update existing job
  updateJob: async (jobId: string, updates: UpdateJobRequest): Promise<JobDescription> => {
    try {
      const response = await api.put<JobDescription>(`/jobs/${jobId}`, updates);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update job');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update job');
    }
  },
  
  // Delete job
  deleteJob: async (jobId: string): Promise<void> => {
    try {
      const response = await api.delete(`/jobs/${jobId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete job');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete job');
    }
  },
  
  // Duplicate job
  duplicateJob: async (jobId: string, newTitle?: string): Promise<JobDescription> => {
    try {
      const response = await api.post<JobDescription>(`/jobs/${jobId}/duplicate`, {
        title: newTitle,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to duplicate job');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to duplicate job');
    }
  },
  
  // Bulk update jobs
  bulkUpdateJobs: async (jobIds: string[], updates: UpdateJobRequest): Promise<JobDescription[]> => {
    try {
      const response = await api.put<JobDescription[]>('/jobs/bulk-update', {
        jobIds,
        updates,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to bulk update jobs');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to bulk update jobs');
    }
  },
  
  // Bulk delete jobs
  bulkDeleteJobs: async (jobIds: string[]): Promise<void> => {
    try {
      const response = await api.delete('/jobs/bulk-delete', {
        data: { jobIds },
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to bulk delete jobs');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to bulk delete jobs');
    }
  },
  
  // Get job templates
  getJobTemplates: async (): Promise<JobTemplate[]> => {
    try {
      const response = await api.get<JobTemplate[]>('/job-templates');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch job templates');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch job templates');
    }
  },
  
  // Get job template by ID
  getJobTemplateById: async (templateId: string): Promise<JobTemplate> => {
    try {
      const response = await api.get<JobTemplate>(`/job-templates/${templateId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch job template');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch job template');
    }
  },
  
  // Create job template
  createJobTemplate: async (templateData: CreateJobTemplateRequest): Promise<JobTemplate> => {
    try {
      const response = await api.post<JobTemplate>('/job-templates', templateData);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create job template');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create job template');
    }
  },
  
  // Update job template
  updateJobTemplate: async (templateId: string, updates: Partial<CreateJobTemplateRequest>): Promise<JobTemplate> => {
    try {
      const response = await api.put<JobTemplate>(`/job-templates/${templateId}`, updates);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update job template');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update job template');
    }
  },
  
  // Delete job template
  deleteJobTemplate: async (templateId: string): Promise<void> => {
    try {
      const response = await api.delete(`/job-templates/${templateId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete job template');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete job template');
    }
  },
  
  // Create job from template
  createJobFromTemplate: async (templateId: string, overrides?: Partial<CreateJobRequest>): Promise<JobDescription> => {
    try {
      const response = await api.post<JobDescription>(`/job-templates/${templateId}/create-job`, overrides);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create job from template');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create job from template');
    }
  },
  
  // Get job statistics
  getJobStatistics: async (dateRange?: [Date, Date]): Promise<{
    total: number;
    active: number;
    completed: number;
    draft: number;
    paused: number;
    averageCompletionTime: number;
    topSkills: Array<{ skill: string; count: number }>;
    topLocations: Array<{ location: string; count: number }>;
  }> => {
    try {
      const queryParams = new URLSearchParams();
      if (dateRange) {
        queryParams.append('startDate', dateRange[0].toISOString());
        queryParams.append('endDate', dateRange[1].toISOString());
      }
      
      const response = await api.get(`/jobs/statistics?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch job statistics');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch job statistics');
    }
  },
  
  // Export jobs
  exportJobs: async (params: {
    jobIds?: string[];
    filters?: JobFilters;
    format: 'csv' | 'excel' | 'json';
    fields?: string[];
  }): Promise<void> => {
    try {
      const response = await api.post('/jobs/export', params, {
        responseType: 'blob',
      });
      
      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `jobs-export.${params.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to export jobs');
    }
  },
  
  // Search jobs with advanced filters
  searchJobs: async (query: string, filters?: JobFilters): Promise<JobDescription[]> => {
    try {
      const response = await api.post<JobDescription[]>('/jobs/search', {
        query,
        filters,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to search jobs');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to search jobs');
    }
  },
};

export default jobsService;