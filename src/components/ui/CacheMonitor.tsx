import React, { useState, useEffect, memo } from 'react';
import { queryPerformance, queryUtils } from '../../services/queryClient';
import { cacheManager } from '../../utils/serviceWorker';
import { formatFileSize } from '../../utils';
import { Button, Card, Badge } from './';

export interface CacheMonitorProps {
  className?: string;
  showDetails?: boolean;
}

interface CacheStats {
  totalQueries: number;
  activeQueries: number;
  staleQueries: number;
  cacheSize: number;
  storageUsage: number;
  storageQuota: number;
}

const CacheMonitor: React.FC<CacheMonitorProps> = memo(({
  className,
  showDetails = false,
}) => {
  const [stats, setStats] = useState<CacheStats>({
    totalQueries: 0,
    activeQueries: 0,
    staleQueries: 0,
    cacheSize: 0,
    storageUsage: 0,
    storageQuota: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateStats = async () => {
    try {
      const queryStats = queryPerformance.getCacheStats();
      const storageUsage = await cacheManager.getSize();
      const storageQuota = await cacheManager.getQuota();

      setStats({
        ...queryStats,
        storageUsage,
        storageQuota,
      });
    } catch (error) {
      console.error('Failed to update cache stats:', error);
    }
  };

  useEffect(() => {
    updateStats();
    
    // Update stats every 30 seconds
    const interval = setInterval(updateStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        queryUtils.clearCache(),
        cacheManager.clear(),
      ]);
      await updateStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStale = async () => {
    setIsLoading(true);
    try {
      queryUtils.removeStaleData();
      await updateStats();
    } catch (error) {
      console.error('Failed to remove stale data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWarmCache = async () => {
    setIsLoading(true);
    try {
      await queryUtils.warmCache();
      await updateStats();
    } catch (error) {
      console.error('Failed to warm cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStoragePercentage = () => {
    if (stats.storageQuota === 0) return 0;
    return Math.round((stats.storageUsage / stats.storageQuota) * 100);
  };

  const getCacheHealthColor = () => {
    const stalePercentage = stats.totalQueries > 0 
      ? (stats.staleQueries / stats.totalQueries) * 100 
      : 0;
    
    if (stalePercentage > 50) return 'text-red-600';
    if (stalePercentage > 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge variant="secondary" size="sm">
          {stats.totalQueries} queries
        </Badge>
        <Badge 
          variant={stats.staleQueries > 0 ? 'warning' : 'success'} 
          size="sm"
        >
          {stats.staleQueries} stale
        </Badge>
        <Badge variant="info" size="sm">
          {formatFileSize(stats.cacheSize)}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Cache Monitor</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={updateStats}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalQueries}
          </div>
          <div className="text-sm text-gray-500">Total Queries</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.activeQueries}
          </div>
          <div className="text-sm text-gray-500">Active</div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold ${getCacheHealthColor()}`}>
            {stats.staleQueries}
          </div>
          <div className="text-sm text-gray-500">Stale</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {formatFileSize(stats.cacheSize)}
          </div>
          <div className="text-sm text-gray-500">Cache Size</div>
        </div>
      </div>

      {/* Storage Usage */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Storage Usage
          </span>
          <span className="text-sm text-gray-500">
            {formatFileSize(stats.storageUsage)} / {formatFileSize(stats.storageQuota)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              getStoragePercentage() > 80
                ? 'bg-red-500'
                : getStoragePercentage() > 60
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(getStoragePercentage(), 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {getStoragePercentage()}% used
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleWarmCache}
          disabled={isLoading}
        >
          Warm Cache
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemoveStale}
          disabled={isLoading}
        >
          Remove Stale
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearCache}
          disabled={isLoading}
        >
          Clear All
        </Button>
      </div>

      {/* Cache Health Indicator */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Cache Health
          </span>
          <Badge
            variant={
              stats.staleQueries === 0
                ? 'success'
                : stats.staleQueries < stats.totalQueries * 0.25
                ? 'warning'
                : 'error'
            }
            size="sm"
          >
            {stats.staleQueries === 0
              ? 'Excellent'
              : stats.staleQueries < stats.totalQueries * 0.25
              ? 'Good'
              : 'Needs Attention'}
          </Badge>
        </div>
        
        {stats.staleQueries > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {Math.round((stats.staleQueries / stats.totalQueries) * 100)}% of queries are stale
          </div>
        )}
      </div>
    </Card>
  );
});

CacheMonitor.displayName = 'CacheMonitor';

export default CacheMonitor;