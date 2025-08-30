import { api } from './api';
import { DashboardMetrics, RecentActivity, ActivityFilters } from '../types';

// Dashboard service request/response types
export interface DashboardMetricsResponse extends DashboardMetrics {}

export interface RecentActivityResponse {
  activities: RecentActivity[];
  total: number;
  hasMore: boolean;
}

export interface ActivitySearchParams {
  limit?: number;
  offset?: number;
  type?: RecentActivity['type'][];
  dateRange?: [Date, Date];
  status?: RecentActivity['status'][];
}

// Dashboard service
export const dashboardService = {
  // Get dashboard metrics
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    try {
      const response = await api.get<DashboardMetrics>('/dashboard/metrics');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch dashboard metrics');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch dashboard metrics');
    }
  },

  // Get recent activity
  getRecentActivity: async (params: ActivitySearchParams = {}): Promise<RecentActivityResponse> => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination params
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      
      // Add filter params
      if (params.type && params.type.length > 0) {
        queryParams.append('type', params.type.join(','));
      }
      if (params.status && params.status.length > 0) {
        queryParams.append('status', params.status.join(','));
      }
      if (params.dateRange) {
        queryParams.append('startDate', params.dateRange[0].toISOString());
        queryParams.append('endDate', params.dateRange[1].toISOString());
      }
      
      const response = await api.get<RecentActivityResponse>(`/dashboard/activity?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch recent activity');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch recent activity');
    }
  },

  // Get system health status
  getSystemHealth: async (): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    services: Array<{
      name: string;
      status: 'up' | 'down' | 'degraded';
      responseTime?: number;
      lastCheck: Date;
    }>;
    uptime: number;
  }> => {
    try {
      const response = await api.get('/dashboard/health');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch system health');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch system health');
    }
  },

  // Get performance metrics
  getPerformanceMetrics: async (timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    apiResponseTime: Array<{ timestamp: Date; value: number }>;
    pipelineSuccessRate: Array<{ timestamp: Date; value: number }>;
    candidatesPerHour: Array<{ timestamp: Date; value: number }>;
    errorRate: Array<{ timestamp: Date; value: number }>;
  }> => {
    try {
      const response = await api.get(`/dashboard/performance?timeRange=${timeRange}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch performance metrics');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch performance metrics');
    }
  },
};

export default dashboardService;