import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { DashboardMetrics, RecentActivity, ActivityFilters } from '../types';
import type { ActivitySearchParams } from '../services/dashboardService';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: () => [...dashboardKeys.all, 'metrics'] as const,
  activity: () => [...dashboardKeys.all, 'activity'] as const,
  activityList: (params: ActivitySearchParams) => [...dashboardKeys.activity(), params] as const,
  health: () => [...dashboardKeys.all, 'health'] as const,
  performance: (timeRange: string) => [...dashboardKeys.all, 'performance', timeRange] as const,
};

// Dashboard metrics hook with real-time updates
export const useDashboardMetrics = (refetchInterval?: number) => {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: () => dashboardService.getDashboardMetrics(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: refetchInterval || 30000, // 30 seconds default
    refetchIntervalInBackground: true,
  });
};

// Recent activity hook
export const useRecentActivity = (params: ActivitySearchParams = {}) => {
  return useQuery({
    queryKey: dashboardKeys.activityList(params),
    queryFn: () => dashboardService.getRecentActivity(params),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 15000, // 15 seconds
  });
};

// System health hook
export const useSystemHealth = (refetchInterval?: number) => {
  return useQuery({
    queryKey: dashboardKeys.health(),
    queryFn: () => dashboardService.getSystemHealth(),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: refetchInterval || 10000, // 10 seconds default
    refetchIntervalInBackground: true,
  });
};

// Performance metrics hook
export const usePerformanceMetrics = (timeRange: '1h' | '24h' | '7d' | '30d' = '24h') => {
  return useQuery({
    queryKey: dashboardKeys.performance(timeRange),
    queryFn: () => dashboardService.getPerformanceMetrics(timeRange),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 60000, // 1 minute
  });
};

// Real-time dashboard updates hook
export const useRealTimeDashboard = () => {
  const queryClient = useQueryClient();
  
  // Refresh all dashboard data
  const refreshDashboard = () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  };
  
  // Refresh specific sections
  const refreshMetrics = () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.metrics() });
  };
  
  const refreshActivity = () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.activity() });
  };
  
  return {
    refreshDashboard,
    refreshMetrics,
    refreshActivity,
  };
};

export default {
  useDashboardMetrics,
  useRecentActivity,
  useSystemHealth,
  usePerformanceMetrics,
  useRealTimeDashboard,
};