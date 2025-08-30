import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { candidatesService } from '../services/queryClient';
import { Candidate, CandidateFilters } from '../types';
import type { 
  CandidateSearchParams, 
  UpdateCandidateRequest,
  BulkUpdateCandidatesRequest,
  ExportCandidatesRequest 
} from '../services/candidatesService';

// Query keys
export const candidatesKeys = {
  all: ['candidates'] as const,
  lists: () => [...candidatesKeys.all, 'list'] as const,
  list: (params: CandidateSearchParams) => [...candidatesKeys.lists(), params] as const,
  details: () => [...candidatesKeys.all, 'detail'] as const,
  detail: (id: string) => [...candidatesKeys.details(), id] as const,
  history: (id: string) => [...candidatesKeys.detail(id), 'history'] as const,
  similar: (id: string, limit?: number) => [...candidatesKeys.detail(id), 'similar', limit] as const,
  analytics: (filters?: CandidateFilters) => [...candidatesKeys.all, 'analytics', filters] as const,
  search: (query: string, filters?: CandidateFilters) => [...candidatesKeys.all, 'search', query, filters] as const,
  compare: (candidateIds: string[]) => [...candidatesKeys.all, 'compare', candidateIds] as const,
  byJob: (jobId: string, params?: CandidateSearchParams) => [...candidatesKeys.all, 'byJob', jobId, params] as const,
  tags: () => [...candidatesKeys.all, 'tags'] as const,
  skills: () => [...candidatesKeys.all, 'skills'] as const,
  locations: () => [...candidatesKeys.all, 'locations'] as const,
};

// Candidates list hook
export const useCandidates = (params: CandidateSearchParams = {}) => {
  return useQuery({
    queryKey: candidatesKeys.list(params),
    queryFn: () => candidatesService.getCandidates(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Infinite candidates hook for pagination with virtual scrolling
export const useInfiniteCandidates = (params: Omit<CandidateSearchParams, 'page'> = {}) => {
  return useInfiniteQuery({
    queryKey: [...candidatesKeys.lists(), 'infinite', params],
    queryFn: ({ pageParam = 1 }) => candidatesService.getCandidates({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasNext ? lastPage.page + 1 : undefined,
    getPreviousPageParam: (firstPage) => firstPage.hasPrev ? firstPage.page - 1 : undefined,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Single candidate hook
export const useCandidate = (candidateId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: candidatesKeys.detail(candidateId),
    queryFn: () => candidatesService.getCandidateById(candidateId),
    enabled: enabled && Boolean(candidateId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Candidate history hook
export const useCandidateHistory = (candidateId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: candidatesKeys.history(candidateId),
    queryFn: () => candidatesService.getCandidateHistory(candidateId),
    enabled: enabled && Boolean(candidateId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Similar candidates hook
export const useSimilarCandidates = (candidateId: string, limit: number = 10, enabled: boolean = true) => {
  return useQuery({
    queryKey: candidatesKeys.similar(candidateId, limit),
    queryFn: () => candidatesService.getSimilarCandidates(candidateId, limit),
    enabled: enabled && Boolean(candidateId),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Candidate analytics hook
export const useCandidateAnalytics = (filters?: CandidateFilters) => {
  return useQuery({
    queryKey: candidatesKeys.analytics(filters),
    queryFn: () => candidatesService.getCandidateAnalytics(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Candidate search hook
export const useCandidateSearch = (query: string, filters?: CandidateFilters, enabled: boolean = true) => {
  return useQuery({
    queryKey: candidatesKeys.search(query, filters),
    queryFn: () => candidatesService.searchCandidates(query, filters),
    enabled: enabled && Boolean(query.trim()),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Compare candidates hook
export const useCompareCandidates = (candidateIds: string[], enabled: boolean = true) => {
  return useQuery({
    queryKey: candidatesKeys.compare(candidateIds),
    queryFn: () => candidatesService.compareCandidates(candidateIds),
    enabled: enabled && candidateIds.length > 1,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Candidates by job hook
export const useCandidatesByJob = (jobId: string, params: CandidateSearchParams = {}, enabled: boolean = true) => {
  return useQuery({
    queryKey: candidatesKeys.byJob(jobId, params),
    queryFn: () => candidatesService.getCandidatesByJobId(jobId, params),
    enabled: enabled && Boolean(jobId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// All tags hook
export const useCandidateTags = () => {
  return useQuery({
    queryKey: candidatesKeys.tags(),
    queryFn: () => candidatesService.getAllTags(),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

// All skills hook
export const useCandidateSkills = () => {
  return useQuery({
    queryKey: candidatesKeys.skills(),
    queryFn: () => candidatesService.getAllSkills(),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

// All locations hook
export const useCandidateLocations = () => {
  return useQuery({
    queryKey: candidatesKeys.locations(),
    queryFn: () => candidatesService.getAllLocations(),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

// Update candidate mutation
export const useUpdateCandidate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ candidateId, updates }: { candidateId: string; updates: UpdateCandidateRequest }) => 
      candidatesService.updateCandidate(candidateId, updates),
    onSuccess: (updatedCandidate) => {
      // Update the candidate in cache
      queryClient.setQueryData(candidatesKeys.detail(updatedCandidate.id), updatedCandidate);
      
      // Invalidate candidates list queries
      queryClient.invalidateQueries({ queryKey: candidatesKeys.lists() });
      
      // Invalidate analytics
      queryClient.invalidateQueries({ queryKey: candidatesKeys.analytics() });
      
      // Invalidate history
      queryClient.invalidateQueries({ queryKey: candidatesKeys.history(updatedCandidate.id) });
    },
  });
};

// Bulk update candidates mutation
export const useBulkUpdateCandidates = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: BulkUpdateCandidatesRequest) => candidatesService.bulkUpdateCandidates(request),
    onSuccess: (updatedCandidates, variables) => {
      // Update each candidate in cache
      updatedCandidates.forEach(candidate => {
        queryClient.setQueryData(candidatesKeys.detail(candidate.id), candidate);
      });
      
      // Invalidate candidates list queries
      queryClient.invalidateQueries({ queryKey: candidatesKeys.lists() });
      
      // Invalidate analytics
      queryClient.invalidateQueries({ queryKey: candidatesKeys.analytics() });
      
      // Invalidate history for updated candidates
      variables.candidateIds.forEach(candidateId => {
        queryClient.invalidateQueries({ queryKey: candidatesKeys.history(candidateId) });
      });
    },
  });
};

// Delete candidate mutation
export const useDeleteCandidate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (candidateId: string) => candidatesService.deleteCandidate(candidateId),
    onSuccess: (_, candidateId) => {
      // Remove candidate from cache
      queryClient.removeQueries({ queryKey: candidatesKeys.detail(candidateId) });
      
      // Invalidate candidates list queries
      queryClient.invalidateQueries({ queryKey: candidatesKeys.lists() });
      
      // Invalidate analytics
      queryClient.invalidateQueries({ queryKey: candidatesKeys.analytics() });
    },
  });
};

// Bulk delete candidates mutation
export const useBulkDeleteCandidates = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (candidateIds: string[]) => candidatesService.bulkDeleteCandidates(candidateIds),
    onSuccess: (_, candidateIds) => {
      // Remove candidates from cache
      candidateIds.forEach(candidateId => {
        queryClient.removeQueries({ queryKey: candidatesKeys.detail(candidateId) });
      });
      
      // Invalidate candidates list queries
      queryClient.invalidateQueries({ queryKey: candidatesKeys.lists() });
      
      // Invalidate analytics
      queryClient.invalidateQueries({ queryKey: candidatesKeys.analytics() });
    },
  });
};

// Add candidate tags mutation
export const useAddCandidateTags = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ candidateId, tags }: { candidateId: string; tags: string[] }) => 
      candidatesService.addCandidateTags(candidateId, tags),
    onSuccess: (updatedCandidate) => {
      // Update the candidate in cache
      queryClient.setQueryData(candidatesKeys.detail(updatedCandidate.id), updatedCandidate);
      
      // Invalidate candidates list queries
      queryClient.invalidateQueries({ queryKey: candidatesKeys.lists() });
      
      // Invalidate tags list
      queryClient.invalidateQueries({ queryKey: candidatesKeys.tags() });
      
      // Invalidate history
      queryClient.invalidateQueries({ queryKey: candidatesKeys.history(updatedCandidate.id) });
    },
  });
};

// Remove candidate tags mutation
export const useRemoveCandidateTags = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ candidateId, tags }: { candidateId: string; tags: string[] }) => 
      candidatesService.removeCandidateTags(candidateId, tags),
    onSuccess: (updatedCandidate) => {
      // Update the candidate in cache
      queryClient.setQueryData(candidatesKeys.detail(updatedCandidate.id), updatedCandidate);
      
      // Invalidate candidates list queries
      queryClient.invalidateQueries({ queryKey: candidatesKeys.lists() });
      
      // Invalidate history
      queryClient.invalidateQueries({ queryKey: candidatesKeys.history(updatedCandidate.id) });
    },
  });
};

// Add candidate note mutation
export const useAddCandidateNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ candidateId, note }: { candidateId: string; note: string }) => 
      candidatesService.addCandidateNote(candidateId, note),
    onSuccess: (_, variables) => {
      // Invalidate history
      queryClient.invalidateQueries({ queryKey: candidatesKeys.history(variables.candidateId) });
    },
  });
};

// Export candidates mutation
export const useExportCandidates = () => {
  return useMutation({
    mutationFn: (request: ExportCandidatesRequest) => candidatesService.exportCandidates(request),
  });
};

// Optimistic update helper for candidate status
export const useOptimisticCandidateUpdate = () => {
  const queryClient = useQueryClient();
  
  const updateCandidateOptimistically = (candidateId: string, updates: Partial<Candidate>) => {
    // Get current candidate data
    const currentCandidate = queryClient.getQueryData<Candidate>(candidatesKeys.detail(candidateId));
    
    if (currentCandidate) {
      // Optimistically update the candidate
      const optimisticCandidate = { ...currentCandidate, ...updates };
      queryClient.setQueryData(candidatesKeys.detail(candidateId), optimisticCandidate);
      
      // Return rollback function
      return () => {
        queryClient.setQueryData(candidatesKeys.detail(candidateId), currentCandidate);
      };
    }
    
    return () => {}; // No-op rollback
  };
  
  return { updateCandidateOptimistically };
};