import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useDashboardMetrics, 
  useRecentActivity, 
  useActivePipelines,
  useCandidateAnalytics 
} from '../../hooks';
import { MetricCard, QuickActions, RecentActivity } from '../../components/dashboard';
import { Button } from '../../components/ui';
import { QuickAction, ActivityFilters } from '../../types';
import type { ActivitySearchParams } from '../../services/dashboardService';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activityFilters, setActivityFilters] = useState<ActivitySearchParams>({ limit: 10 });

  // Fetch dashboard data
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: activityData, isLoading: activityLoading } = useRecentActivity(activityFilters);
  const { data: activePipelines, isLoading: pipelinesLoading } = useActivePipelines();
  const { data: candidateAnalytics } = useCandidateAnalytics();

  // Quick actions configuration
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'create-job',
      title: 'Create New Job',
      description: 'Start a new candidate sourcing job',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      action: () => navigate('/jobs/new'),
      variant: 'primary',
    },
    {
      id: 'view-candidates',
      title: 'Browse Candidates',
      description: 'View and manage sourced candidates',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      action: () => navigate('/candidates'),
      variant: 'secondary',
    },
    {
      id: 'monitor-pipelines',
      title: 'Monitor Pipelines',
      description: 'Track active sourcing pipelines',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      action: () => navigate('/pipeline'),
      variant: 'outline',
    },
    {
      id: 'export-data',
      title: 'Export Data',
      description: 'Download candidate and pipeline data',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      action: () => {
        // TODO: Implement export functionality
        console.log('Export data clicked');
      },
      variant: 'outline',
    },
    {
      id: 'view-analytics',
      title: 'View Analytics',
      description: 'Detailed performance insights',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      action: () => navigate('/analytics'),
      variant: 'outline',
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure application settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      action: () => navigate('/settings'),
      variant: 'outline',
    },
  ], [navigate]);

  // Handle activity filtering
  const handleActivityFilter = (filters: ActivityFilters) => {
    setActivityFilters(prev => ({
      ...prev,
      type: filters.type,
      status: filters.status,
      dateRange: filters.dateRange,
    }));
  };

  // Handle load more activity
  const handleLoadMoreActivity = () => {
    setActivityFilters(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 10),
    }));
  };

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    if (!metrics) return null;

    const weeklyGrowth = metrics.candidatesThisWeek > 0 
      ? ((metrics.candidatesThisWeek / (metrics.totalCandidates - metrics.candidatesThisWeek)) * 100)
      : 0;

    const monthlyGrowth = metrics.candidatesThisMonth > 0
      ? ((metrics.candidatesThisMonth / (metrics.totalCandidates - metrics.candidatesThisMonth)) * 100)
      : 0;

    return {
      weeklyGrowth: Math.round(weeklyGrowth * 100) / 100,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
    };
  }, [metrics]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening with your sourcing pipeline.
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Candidates"
            value={metrics?.totalCandidates || 0}
            change={derivedMetrics ? {
              value: derivedMetrics.weeklyGrowth,
              period: 'this week',
              trend: derivedMetrics.weeklyGrowth > 0 ? 'up' : derivedMetrics.weeklyGrowth < 0 ? 'down' : 'neutral'
            } : undefined}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            loading={metricsLoading}
            onClick={() => navigate('/candidates')}
          />

          <MetricCard
            title="Active Jobs"
            value={metrics?.totalJobs || 0}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
            }
            loading={metricsLoading}
            onClick={() => navigate('/jobs')}
          />

          <MetricCard
            title="Active Pipelines"
            value={metrics?.activePipelines || 0}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            loading={metricsLoading || pipelinesLoading}
            onClick={() => navigate('/pipeline')}
          />

          <MetricCard
            title="Success Rate"
            value={`${Math.round((metrics?.successRate || 0) * 100)}%`}
            change={{
              value: 5.2,
              period: 'vs last month',
              trend: 'up'
            }}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            loading={metricsLoading}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Average Score"
            value={metrics?.averageScore?.toFixed(1) || '0.0'}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
            loading={metricsLoading}
          />

          <MetricCard
            title="This Week"
            value={metrics?.candidatesThisWeek || 0}
            change={derivedMetrics ? {
              value: derivedMetrics.weeklyGrowth,
              period: 'vs last week',
              trend: derivedMetrics.weeklyGrowth > 0 ? 'up' : derivedMetrics.weeklyGrowth < 0 ? 'down' : 'neutral'
            } : undefined}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            loading={metricsLoading}
          />

          <MetricCard
            title="This Month"
            value={metrics?.candidatesThisMonth || 0}
            change={derivedMetrics ? {
              value: derivedMetrics.monthlyGrowth,
              period: 'vs last month',
              trend: derivedMetrics.monthlyGrowth > 0 ? 'up' : derivedMetrics.monthlyGrowth < 0 ? 'down' : 'neutral'
            } : undefined}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            loading={metricsLoading}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions actions={quickActions} loading={metricsLoading} />
        </div>

        {/* Recent Activity and Analytics Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivity
              activities={activityData?.activities || []}
              loading={activityLoading}
              hasMore={activityData?.hasMore}
              onLoadMore={handleLoadMoreActivity}
              onFilter={handleActivityFilter}
            />
          </div>

          {/* Analytics Preview and Top Performing Job */}
          <div className="space-y-6">
            {/* Top Performing Job Card */}
            {metrics?.topPerformingJob ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Job</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">{metrics.topPerformingJob.title}</p>
                    <p className="text-sm text-gray-600">
                      {metrics.topPerformingJob.candidatesFound} candidates found
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/jobs/${metrics.topPerformingJob?.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
                <p className="text-gray-600">
                  Create your first job to start seeing performance insights here.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate('/jobs/new')}
                >
                  Create Job
                </Button>
              </div>
            )}

            {/* Analytics Preview Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Analytics Preview</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/analytics')}
                >
                  View All
                </Button>
              </div>
              
              {candidateAnalytics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-900">
                        {candidateAnalytics.averageScore.toFixed(1)}
                      </p>
                      <p className="text-xs text-blue-700">Avg Score</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-900">
                        {candidateAnalytics.topSkills.length}
                      </p>
                      <p className="text-xs text-green-700">Skills</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Top Skills</p>
                    <div className="space-y-1">
                      {candidateAnalytics.topSkills.slice(0, 3).map((skill, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">{skill.skill}</span>
                          <span className="font-medium">{skill.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No analytics data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;