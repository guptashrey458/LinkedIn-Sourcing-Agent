import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { jobsService } from '../services/queryClient';
import { JobDescription, JobTemplate, JobFilters } from '../types';
import type { 
  JobSearchParams, 
  CreateJobRequest, 
  UpdateJobRequest,
  CreateJobTemplateRequest 
} from '../services/jobsService';

// Query keys
export const jobsKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobsKeys.all, 'list'] as const,
  list: (params: JobSearchParams) => [...jobsKeys.lists(), params] as const,
  details: () => [...jobsKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobsKeys.details(), id] as const,
  templates: () => [...jobsKeys.all, 'templates'] as const,
  template: (id: string) => [...jobsKeys.templates(), id] as const,
  statistics: (dateRange?: [Date, Date]) => [...jobsKeys.all, 'statistics', dateRange] as const,
  search: (query: string, filters?: JobFilters) => [...jobsKeys.all, 'search', query, filters] as const,
};

// Jobs list hook
export const useJobs = (params: JobSearchParams = {}) => {
  return useQuery({
    queryKey: jobsKeys.list(params),
    queryFn: () => jobsService.getJobs(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Infinite jobs hook for pagination
export const useInfiniteJobs = (params: Omit<JobSearchParams, 'page'> = {}) => {
  return useInfiniteQuery({
    queryKey: [...jobsKeys.lists(), 'infinite', params],
    queryFn: ({ pageParam = 1 }) => jobsService.getJobs({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasNext ? lastPage.page + 1 : undefined,
    getPreviousPageParam: (firstPage) => firstPage.hasPrev ? firstPage.page - 1 : undefined,
  });
};

// Single job hook
export const useJob = (jobId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: jobsKeys.detail(jobId),
    queryFn: () => jobsService.getJobById(jobId),
    enabled: enabled && Boolean(jobId),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Job templates hook
export const useJobTemplates = () => {
  return useQuery({
    queryKey: jobsKeys.templates(),
    queryFn: () => jobsService.getJobTemplates(),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

// Single job template hook
export const useJobTemplate = (templateId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: jobsKeys.template(templateId),
    queryFn: () => jobsService.getJobTemplateById(templateId),
    enabled: enabled && Boolean(templateId),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

// Job statistics hook
export const useJobStatistics = (dateRange?: [Date, Date]) => {
  return useQuery({
    queryKey: jobsKeys.statistics(dateRange),
    queryFn: () => jobsService.getJobStatistics(dateRange),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Job search hook
export const useJobSearch = (query: string, filters?: JobFilters, enabled: boolean = true) => {
  return useQuery({
    queryKey: jobsKeys.search(query, filters),
    queryFn: () => jobsService.searchJobs(query, filters),
    enabled: enabled && Boolean(query.trim()),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Create job mutation
export const useCreateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobData: CreateJobRequest) => jobsService.createJob(jobData),
    onSuccess: (newJob) => {
      // Invalidate jobs list queries
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
      
      // Add the new job to the cache
      queryClient.setQueryData(jobsKeys.detail(newJob.id), newJob);
      
      // Update statistics
      queryClient.invalidateQueries({ queryKey: jobsKeys.statistics() });
    },
  });
};

// Update job mutation
export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, updates }: { jobId: string; updates: UpdateJobRequest }) => 
      jobsService.updateJob(jobId, updates),
    onSuccess: (updatedJob) => {
      // Update the job in cache
      queryClient.setQueryData(jobsKeys.detail(updatedJob.id), updatedJob);
      
      // Invalidate jobs list queries
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
      
      // Update statistics
      queryClient.invalidateQueries({ queryKey: jobsKeys.statistics() });
    },
  });
};

// Delete job mutation
export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => jobsService.deleteJob(jobId),
    onSuccess: (_, jobId) => {
      // Remove job from cache
      queryClient.removeQueries({ queryKey: jobsKeys.detail(jobId) });
      
      // Invalidate jobs list queries
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
      
      // Update statistics
      queryClient.invalidateQueries({ queryKey: jobsKeys.statistics() });
    },
  });
};

// Duplicate job mutation
export const useDuplicateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, newTitle }: { jobId: string; newTitle?: string }) => 
      jobsService.duplicateJob(jobId, newTitle),
    onSuccess: (duplicatedJob) => {
      // Add the duplicated job to the cache
      queryClient.setQueryData(jobsKeys.detail(duplicatedJob.id), duplicatedJob);
      
      // Invalidate jobs list queries
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
      
      // Update statistics
      queryClient.invalidateQueries({ queryKey: jobsKeys.statistics() });
    },
  });
};

// Bulk update jobs mutation
export const useBulkUpdateJobs = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobIds, updates }: { jobIds: string[]; updates: UpdateJobRequest }) => 
      jobsService.bulkUpdateJobs(jobIds, updates),
    onSuccess: (updatedJobs) => {
      // Update each job in cache
      updatedJobs.forEach(job => {
        queryClient.setQueryData(jobsKeys.detail(job.id), job);
      });
      
      // Invalidate jobs list queries
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
      
      // Update statistics
      queryClient.invalidateQueries({ queryKey: jobsKeys.statistics() });
    },
  });
};

// Bulk delete jobs mutation
export const useBulkDeleteJobs = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobIds: string[]) => jobsService.bulkDeleteJobs(jobIds),
    onSuccess: (_, jobIds) => {
      // Remove jobs from cache
      jobIds.forEach(jobId => {
        queryClient.removeQueries({ queryKey: jobsKeys.detail(jobId) });
      });
      
      // Invalidate jobs list queries
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
      
      // Update statistics
      queryClient.invalidateQueries({ queryKey: jobsKeys.statistics() });
    },
  });
};

// Create job template mutation
export const useCreateJobTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (templateData: CreateJobTemplateRequest) => jobsService.createJobTemplate(templateData),
    onSuccess: (newTemplate) => {
      // Invalidate templates query
      queryClient.invalidateQueries({ queryKey: jobsKeys.templates() });
      
      // Add the new template to the cache
      queryClient.setQueryData(jobsKeys.template(newTemplate.id), newTemplate);
    },
  });
};

// Update job template mutation
export const useUpdateJobTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ templateId, updates }: { templateId: string; updates: Partial<CreateJobTemplateRequest> }) => 
      jobsService.updateJobTemplate(templateId, updates),
    onSuccess: (updatedTemplate) => {
      // Update the template in cache
      queryClient.setQueryData(jobsKeys.template(updatedTemplate.id), updatedTemplate);
      
      // Invalidate templates query
      queryClient.invalidateQueries({ queryKey: jobsKeys.templates() });
    },
  });
};

// Delete job template mutation
export const useDeleteJobTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (templateId: string) => jobsService.deleteJobTemplate(templateId),
    onSuccess: (_, templateId) => {
      // Remove template from cache
      queryClient.removeQueries({ queryKey: jobsKeys.template(templateId) });
      
      // Invalidate templates query
      queryClient.invalidateQueries({ queryKey: jobsKeys.templates() });
    },
  });
};

// Create job from template mutation
export const useCreateJobFromTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ templateId, overrides }: { templateId: string; overrides?: Partial<CreateJobRequest> }) => 
      jobsService.createJobFromTemplate(templateId, overrides),
    onSuccess: (newJob) => {
      // Add the new job to the cache
      queryClient.setQueryData(jobsKeys.detail(newJob.id), newJob);
      
      // Invalidate jobs list queries
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
      
      // Update statistics
      queryClient.invalidateQueries({ queryKey: jobsKeys.statistics() });
    },
  });
};

// Export jobs mutation
export const useExportJobs = () => {
  return useMutation({
    mutationFn: (params: {
      jobIds?: string[];
      filters?: JobFilters;
      format: 'csv' | 'excel' | 'json';
      fields?: string[];
    }) => jobsService.exportJobs(params),
  });
};