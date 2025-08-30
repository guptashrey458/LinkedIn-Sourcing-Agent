import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import { usePipelineAnalytics } from '../../hooks/usePipeline';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Loading from '../ui/Loading';
import Select from '../ui/Select';
import { 
  AreaChart, 
  BarChart, 
  LineChart, 
  PieChart as PieChartComponent 
} from '../charts';
import { format, subDays, subWeeks, subMonths } from 'date-fns';

interface PipelineAnalyticsProps {
  className?: string;
}

const PipelineAnalytics: React.FC<PipelineAnalyticsProps> = ({
  className = ''
}) => {
  const [dateRange, setDateRange] = useState<[Date, Date]>(() => [
    subDays(new Date(), 30),
    new Date()
  ]);
  
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  
  // Fetch analytics data
  const { 
    data: analytics, 
    isLoading, 
    error 
  } = usePipelineAnalytics(dateRange);
  
  // Update date range based on timeframe
  const handleTimeframeChange = (newTimeframe: '7d' | '30d' | '90d' | '1y') => {
    setTimeframe(newTimeframe);
    
    const now = new Date();
    let startDate: Date;
    
    switch (newTimeframe) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '1y':
        startDate = subDays(now, 365);
        break;
      default:
        startDate = subDays(now, 30);
    }
    
    setDateRange([startDate, now]);
  };
  
  // Prepare chart data
  const chartData = useMemo(() => {
    if (!analytics) return null;
    
    // Performance trends chart data
    const performanceData = analytics.performanceTrends.map(trend => ({
      date: format(new Date(trend.date), 'MMM d'),
      totalRuns: trend.totalRuns,
      successfulRuns: trend.successfulRuns,
      successRate: trend.totalRuns > 0 ? (trend.successfulRuns / trend.totalRuns) * 100 : 0,
      averageDuration: trend.averageDuration / 1000 // Convert to seconds
    }));
    
    // Stage performance chart data
    const stageData = analytics.stagePerformance.map(stage => ({
      stage: stage.stage.charAt(0).toUpperCase() + stage.stage.slice(1),
      duration: stage.averageDuration / 1000, // Convert to seconds
      successRate: stage.successRate * 100,
      errorRate: stage.errorRate * 100
    }));
    
    // Error distribution pie chart data
    const errorData = analytics.errorDistribution.map(error => ({
      name: `${error.stage}: ${error.errorType}`,
      value: error.count,
      stage: error.stage,
      errorType: error.errorType
    }));
    
    return {
      performance: performanceData,
      stages: stageData,
      errors: errorData
    };
  }, [analytics]);
  
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loading size="lg" text="Loading analytics..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Failed to Load Analytics
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
      </Card>
    );
  }
  
  if (!analytics) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Analytics Data
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          No pipeline data available for the selected time period.
        </p>
      </Card>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pipeline Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Performance insights and trends
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select
            value={timeframe}
            onChange={handleTimeframeChange}
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: '1y', label: 'Last year' }
            ]}
          />
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Runs"
          value={analytics.totalRuns}
          icon={<BarChart3 className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="Success Rate"
          value={`${Math.round(analytics.successRate * 100)}%`}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
          trend={analytics.successRate > 0.8 ? 'up' : 'down'}
        />
        <MetricCard
          title="Avg Duration"
          value={`${Math.round(analytics.averageDuration / 1000)}s`}
          icon={<Clock className="w-6 h-6" />}
          color="purple"
        />
        <MetricCard
          title="Avg Candidates"
          value={Math.round(analytics.averageCandidatesFound)}
          icon={<Users className="w-6 h-6" />}
          color="orange"
        />
      </div>
      
      {/* Performance Trends */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Performance Trends
          </h3>
          {chartData?.performance && chartData.performance.length > 0 ? (
            <div className="h-80">
              <AreaChart
                data={chartData.performance}
                xKey="date"
                yKeys={[
                  { key: 'totalRuns', name: 'Total Runs', color: '#3B82F6' },
                  { key: 'successfulRuns', name: 'Successful Runs', color: '#10B981' }
                ]}
                height={320}
              />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No trend data available
            </div>
          )}
        </div>
      </Card>
      
      {/* Stage Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Stage Performance
            </h3>
            {chartData?.stages && chartData.stages.length > 0 ? (
              <div className="h-64">
                <BarChart
                  data={chartData.stages}
                  xKey="stage"
                  yKeys={[
                    { key: 'duration', name: 'Avg Duration (s)', color: '#8B5CF6' },
                    { key: 'successRate', name: 'Success Rate (%)', color: '#10B981' }
                  ]}
                  height={256}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No stage data available
              </div>
            )}
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Error Distribution
            </h3>
            {chartData?.errors && chartData.errors.length > 0 ? (
              <div className="h-64">
                <PieChartComponent
                  data={chartData.errors}
                  dataKey="value"
                  nameKey="name"
                  height={256}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No error data available
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Stage Details */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Stage Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.stagePerformance.map((stage, index) => (
              <div 
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                    {stage.stage}
                  </h4>
                  <Badge 
                    variant={stage.successRate > 0.8 ? 'success' : stage.successRate > 0.6 ? 'warning' : 'error'}
                  >
                    {Math.round(stage.successRate * 100)}%
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg Duration:</span>
                    <span className="font-medium">
                      {Math.round(stage.averageDuration / 1000)}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Error Rate:</span>
                    <span className="font-medium text-red-600">
                      {Math.round(stage.errorRate * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      
      {/* Success Rate Trend */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Success Rate Trend
          </h3>
          {chartData?.performance && chartData.performance.length > 0 ? (
            <div className="h-64">
              <LineChart
                data={chartData.performance}
                xKey="date"
                yKeys={[
                  { key: 'successRate', name: 'Success Rate (%)', color: '#10B981' }
                ]}
                height={256}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No success rate data available
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: 'up' | 'down';
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  subtitle
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'green':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'purple':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'orange':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'red':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };
  
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${getColorClasses(color)}`}>
            {icon}
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? 'Trending up' : 'Trending down'}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PipelineAnalytics;