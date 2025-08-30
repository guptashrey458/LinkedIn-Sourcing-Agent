import React, { useState } from 'react';
import { Card, Button, Badge } from '../ui';
import { RecentActivity as Activity, ActivityFilters } from '../../types';
import { cn } from '../../utils';

interface RecentActivityProps {
  activities: Activity[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onFilter?: (filters: ActivityFilters) => void;
  className?: string;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  loading = false,
  hasMore = false,
  onLoadMore,
  onFilter,
  className,
}) => {
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'pipeline_started':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-10V4a1 1 0 00-1-1H5a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1v-1" />
          </svg>
        );
      case 'pipeline_completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'pipeline_failed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'candidate_added':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'job_created':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusBadge = (status?: Activity['status']) => {
    if (!status) return null;

    const variants = {
      success: 'success' as const,
      error: 'error' as const,
      warning: 'warning' as const,
      info: 'info' as const,
    };

    return <Badge variant={variants[status]} size="sm">{status}</Badge>;
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const handleFilterChange = (newFilters: Partial<ActivityFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilter?.(updatedFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilter?.({});
  };

  if (loading && activities.length === 0) {
    return (
      <Card 
        title="Recent Activity" 
        className={className}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filter
          </Button>
        }
      >
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="animate-pulse flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Recent Activity" 
      className={className}
      actions={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          Filter
        </Button>
      }
    >
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2 mb-3">
            <select
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              value={filters.type?.[0] || ''}
              onChange={(e) => handleFilterChange({ type: e.target.value ? [e.target.value as Activity['type']] : undefined })}
            >
              <option value="">All Types</option>
              <option value="pipeline_started">Pipeline Started</option>
              <option value="pipeline_completed">Pipeline Completed</option>
              <option value="pipeline_failed">Pipeline Failed</option>
              <option value="candidate_added">Candidate Added</option>
              <option value="job_created">Job Created</option>
            </select>
            
            <select
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              value={filters.status?.[0] || ''}
              onChange={(e) => handleFilterChange({ status: e.target.value ? [e.target.value as Activity['status']] : undefined })}
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent activity found</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                activity.status === 'success' && 'bg-green-100 text-green-600',
                activity.status === 'error' && 'bg-red-100 text-red-600',
                activity.status === 'warning' && 'bg-yellow-100 text-yellow-600',
                (!activity.status || activity.status === 'info') && 'bg-blue-100 text-blue-600'
              )}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(activity.status)}
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
                {activity.metadata?.candidatesFound && (
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.metadata.candidatesFound} candidates found
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        
        {hasMore && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              loading={loading}
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RecentActivity;