import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { config } from '../utils/config';

// Default query options with enhanced caching strategies
const defaultOptions: DefaultOptions = {
  queries: {
    // Caching strategies
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes after last use
    
    // Retry configuration
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors except 408 (timeout), 429 (rate limit)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        if (error?.response?.status === 408 || error?.response?.status === 429) {
          return failureCount < 2;
        }
        return false;
      }
      // Retry on network errors and 5xx errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch behavior
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: true, // Refetch when component mounts if data is stale
    
    // Network mode
    networkMode: 'online', // Only run queries when online
  },
  mutations: {
    // Retry configuration for mutations
    retry: (failureCount, error: any) => {
      // Don't retry mutations on client errors (4xx)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry on network errors and server errors (5xx)
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Network mode
    networkMode: 'online', // Only run mutations when online
  },
};

// Create query client
export const queryClient = new QueryClient({
  defaultOptions,
});

// Error handler for queries
export const handleQueryError = (error: any) => {
  if (config.environment === 'development') {
    console.error('Query Error:', error);
  }
  
  // You can add global error handling here
  // For example, show toast notifications, log to monitoring service, etc.
};

// Success handler for mutations
export const handleMutationSuccess = (data: any, variables: any, context: any) => {
  if (config.environment === 'development') {
    console.log('Mutation Success:', { data, variables, context });
  }
  
  // You can add global success handling here
  // For example, show success notifications, invalidate related queries, etc.
};

// Error handler for mutations
export const handleMutationError = (error: any, variables: any, context: any) => {
  if (config.environment === 'development') {
    console.error('Mutation Error:', { error, variables, context });
  }
  
  // You can add global error handling here
  // For example, show error notifications, rollback optimistic updates, etc.
};

// Export services
export { default as authService } from './authService';
export { default as jobsService } from './jobsService';
export { default as candidatesService } from './candidatesService';
export { default as pipelineService } from './pipelineService';
export { api, setAuthTokens, clearAuthTokens, getAuthToken, getRefreshToken } from './api';

// Query client utilities for cache management
export const queryUtils = {
  // Invalidate all queries for a specific entity type
  invalidateEntity: (entityType: string) => {
    queryClient.invalidateQueries({ queryKey: [entityType] });
  },
  
  // Clear all cached data
  clearCache: () => {
    queryClient.clear();
  },

  // Smart cache invalidation based on entity relationships
  invalidateRelatedQueries: (entityType: string, entityId?: string) => {
    const invalidationMap: Record<string, string[]> = {
      'jobs': ['candidates', 'pipeline', 'analytics'],
      'candidates': ['jobs', 'analytics'],
      'pipeline': ['jobs', 'candidates', 'analytics'],
      'auth': ['jobs', 'candidates', 'pipeline', 'analytics'], // Clear everything on auth changes
    };

    // Invalidate the main entity
    if (entityId) {
      queryClient.invalidateQueries({ queryKey: [entityType, entityId] });
    } else {
      queryClient.invalidateQueries({ queryKey: [entityType] });
    }

    // Invalidate related entities
    const relatedEntities = invalidationMap[entityType] || [];
    relatedEntities.forEach(relatedEntity => {
      queryClient.invalidateQueries({ queryKey: [relatedEntity] });
    });
  },

  // Selective cache invalidation with conditions
  invalidateConditional: (predicate: (query: any) => boolean) => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    queries.forEach(query => {
      if (predicate(query)) {
        queryClient.invalidateQueries({ queryKey: query.queryKey });
      }
    });
  },

  // Remove stale data beyond a certain age
  removeStaleData: (maxAge: number = 24 * 60 * 60 * 1000) => { // 24 hours default
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const now = Date.now();
    
    queries.forEach(query => {
      const dataUpdatedAt = query.state.dataUpdatedAt;
      if (dataUpdatedAt && (now - dataUpdatedAt) > maxAge) {
        queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
  },
  
  // Prefetch data for better UX
  prefetchJobs: (params = {}) => {
    return queryClient.prefetchQuery({
      queryKey: ['jobs', 'list', params],
      queryFn: () => import('./jobsService').then(m => m.default.getJobs(params)),
      staleTime: 1000 * 60 * 5,
    });
  },
  
  prefetchCandidates: (params = {}) => {
    return queryClient.prefetchQuery({
      queryKey: ['candidates', 'list', params],
      queryFn: () => import('./candidatesService').then(m => m.default.getCandidates(params)),
      staleTime: 1000 * 60 * 2,
    });
  },
  
  prefetchActivePipelines: () => {
    return queryClient.prefetchQuery({
      queryKey: ['pipeline', 'active'],
      queryFn: () => import('./pipelineService').then(m => m.default.getActivePipelines()),
      staleTime: 1000 * 30,
    });
  },
  
  // Optimistic updates helper
  optimisticUpdate: <T>(
    queryKey: any[],
    updater: (oldData: T | undefined) => T,
    rollback?: (oldData: T | undefined) => void
  ) => {
    const previousData = queryClient.getQueryData<T>(queryKey);
    
    // Optimistically update
    queryClient.setQueryData(queryKey, updater(previousData));
    
    // Return rollback function
    return () => {
      if (rollback) {
        rollback(previousData);
      } else {
        queryClient.setQueryData(queryKey, previousData);
      }
    };
  },
  
  // Background sync for real-time data
  enableBackgroundSync: (queryKey: any[], intervalMs: number = 30000) => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active',
      });
    }, intervalMs);

    // Return cleanup function
    return () => clearInterval(intervalId);
  },

  // Cache warming - preload data that users are likely to need
  warmCache: async () => {
    const promises = [
      queryUtils.prefetchJobs({ limit: 10 }),
      queryUtils.prefetchCandidates({ limit: 20 }),
      queryUtils.prefetchActivePipelines(),
    ];

    try {
      await Promise.allSettled(promises);
      console.log('Cache warmed successfully');
    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  },

  // Intelligent prefetching based on user behavior
  smartPrefetch: (currentRoute: string, userRole?: string) => {
    const prefetchMap: Record<string, () => Promise<any>[]> = {
      '/dashboard': () => [
        queryUtils.prefetchJobs({ limit: 5 }),
        queryUtils.prefetchCandidates({ limit: 10 }),
        queryUtils.prefetchActivePipelines(),
      ],
      '/jobs': () => [
        queryUtils.prefetchCandidates({ limit: 20 }),
      ],
      '/candidates': () => [
        queryUtils.prefetchJobs({ limit: 10 }),
      ],
      '/pipeline': () => [
        queryUtils.prefetchJobs({ limit: 10 }),
        queryUtils.prefetchCandidates({ limit: 10 }),
      ],
    };

    const prefetchFunctions = prefetchMap[currentRoute];
    if (prefetchFunctions) {
      Promise.allSettled(prefetchFunctions()).catch(console.warn);
    }
  },
};

// Performance monitoring for queries
export const queryPerformance = {
  // Track query performance
  trackQuery: (queryKey: any[], startTime: number) => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (config.environment === 'development') {
      console.log(`Query ${JSON.stringify(queryKey)} took ${duration}ms`);
    }
    
    // You can send this to your analytics service
    return duration;
  },
  
  // Get cache statistics
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      cacheSize: queries.reduce((size, query) => {
        const data = query.state.data;
        return size + (data ? JSON.stringify(data).length : 0);
      }, 0),
    };
  },
};