import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { LineChart, AreaChart, BarChart } from '../charts';
import { usePipelineAnalytics } from '../../hooks';

interface PipelinePerformanceChartsProps {
  dateRange?: [Date, Date];
  onExport?: (chartType: string, data: any) => void;
  className?: string;
}

const PipelinePerformanceCharts: React.FC<PipelinePerformanceChartsProps> = ({
  dateRange,
  onExport,
  className,
}) => {
  const [activeChart, setActiveChart] = useState<'trends' | 'stages' | 'errors' | 'success'>('trends');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  const { data: analytics, isLoading } = usePipelineAnalytics(dateRange);

  const handleExport = (chartType: string) => {
    if (!analytics || !onExport) return;

    let exportData;
    switch (chartType) {
      case 'trends':
        exportData = analytics.performanceTrends;
        break;
      case 'stages':
        exportData = analytics.stagePerformance;
        break;
      case 'errors':
        exportData = analytics.errorDistribution;
        break;
      case 'success':
        exportData = {
          totalRuns: analytics.totalRuns,
          successRate: analytics.successRate,
          averageDuration: analytics.averageDuration,
          averageCandidatesFound: analytics.averageCandidatesFound,
        };
        break;
      default:
        return;
    }

    onExport(chartType, exportData);
  };

  const chartTabs = [
    { id: 'trends', label: 'Performance Trends', icon: '📈' },
    { id: 'stages', label: 'Stage Performance', icon: '⚙️' },
    { id: 'errors', label: 'Error Analysis', icon: '🚨' },
    { id: 'success', label: 'Success Metrics', icon: '✅' },
  ] as const;

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderChart = () => {
    if (!analytics) return null;

    switch (activeChart) {
      case 'trends':
        const trendsData = analytics.performanceTrends.map(trend => ({
          ...trend,
          date: formatDate(trend.date),
          successRate: ((trend.successfulRuns / trend.totalRuns) * 100).toFixed(1),
          avgDuration: trend.averageDuration,
        }));

        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Pipeline Success Rate Over Time</h4>
              <LineChart
                data={trendsData}
                dataKey="successRate"
                xAxisKey="date"
                color="#10B981"
                height={300}
                showTooltip
                showGrid
              />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Pipeline Volume and Duration</h4>
              <AreaChart
                data={trendsData}
                dataKey="totalRuns"
                xAxisKey="date"
                color="#3B82F6"
                height={300}
                showTooltip
                showGrid
                multiple={[
                  { dataKey: 'totalRuns', color: '#3B82F6', name: 'Total Runs' },
                  { dataKey: 'avgDuration', color: '#F59E0B', name: 'Avg Duration (min)' },
                ]}
              />
            </div>
          </div>
        );

      case 'stages':
        const stageData = analytics.stagePerformance.map(stage => ({
          ...stage,
          avgDurationFormatted: formatDuration(stage.averageDuration),
          successRatePercent: (stage.successRate * 100).toFixed(1),
          errorRatePercent: (stage.errorRate * 100).toFixed(1),
        }));

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Stage Success Rates</h4>
              <BarChart
                data={stageData}
                dataKey="successRatePercent"
                xAxisKey="stage"
                color="#10B981"
                height={300}
                showTooltip
              />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Average Stage Duration</h4>
              <BarChart
                data={stageData}
                dataKey="averageDuration"
                xAxisKey="stage"
                color="#F59E0B"
                height={300}
                showTooltip
              />
            </div>
          </div>
        );

      case 'errors':
        const errorData = analytics.errorDistribution.reduce((acc, error) => {
          const existing = acc.find(item => item.stage === error.stage);
          if (existing) {
            existing.count += error.count;
          } else {
            acc.push({ stage: error.stage, count: error.count });
          }
          return acc;
        }, [] as Array<{ stage: string; count: number }>);

        const errorTypeData = analytics.errorDistribution.reduce((acc, error) => {
          const existing = acc.find(item => item.errorType === error.errorType);
          if (existing) {
            existing.count += error.count;
          } else {
            acc.push({ errorType: error.errorType, count: error.count });
          }
          return acc;
        }, [] as Array<{ errorType: string; count: number }>);

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Errors by Stage</h4>
              <BarChart
                data={errorData}
                dataKey="count"
                xAxisKey="stage"
                color="#EF4444"
                height={300}
                showTooltip
              />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Error Types Distribution</h4>
              <BarChart
                data={errorTypeData}
                dataKey="count"
                xAxisKey="errorType"
                color="#DC2626"
                height={300}
                showTooltip
                orientation="horizontal"
              />
            </div>
          </div>
        );

      case 'success':
        const successMetrics = [
          { metric: 'Total Runs', value: analytics.totalRuns },
          { metric: 'Success Rate', value: (analytics.successRate * 100).toFixed(1) + '%' },
          { metric: 'Avg Duration', value: formatDuration(analytics.averageDuration) },
          { metric: 'Avg Candidates', value: Math.round(analytics.averageCandidatesFound) },
        ];

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {successMetrics.map((metric, index) => (
                <div key={index} className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900 mb-2">{metric.value}</p>
                  <p className="text-sm text-gray-600">{metric.metric}</p>
                </div>
              ))}
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Stage Performance Comparison</h4>
              <BarChart
                data={analytics.stagePerformance}
                dataKey="successRate"
                xAxisKey="stage"
                color="#3B82F6"
                height={300}
                showTooltip
                multiple={[
                  { dataKey: 'successRate', color: '#10B981', name: 'Success Rate' },
                  { dataKey: 'errorRate', color: '#EF4444', name: 'Error Rate' },
                ]}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Pipeline Performance Analytics</h3>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport(activeChart)}
            disabled={!analytics}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Chart Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {chartTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveChart(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeChart === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : analytics ? (
          renderChart()
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-gray-500 font-medium">No pipeline data available</p>
              <p className="text-gray-400 text-sm mt-1">
                Analytics will appear when pipeline runs are available
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Performance Summary */}
      {analytics && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Success Rate</p>
                  <p className="text-lg font-bold text-green-900">
                    {(analytics.successRate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Avg Duration</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatDuration(analytics.averageDuration)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-800">Avg Candidates</p>
                  <p className="text-lg font-bold text-purple-900">
                    {Math.round(analytics.averageCandidatesFound)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PipelinePerformanceCharts;