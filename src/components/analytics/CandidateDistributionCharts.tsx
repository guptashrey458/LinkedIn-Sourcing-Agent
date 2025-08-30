import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { BarChart, PieChart } from '../charts';
import { useCandidateAnalytics } from '../../hooks';
import { CandidateFilters } from '../../types';

interface CandidateDistributionChartsProps {
  filters?: CandidateFilters;
  onExport?: (chartType: string, data: any) => void;
  className?: string;
}

const CandidateDistributionCharts: React.FC<CandidateDistributionChartsProps> = ({
  filters,
  onExport,
  className,
}) => {
  const [activeChart, setActiveChart] = useState<'score' | 'location' | 'skills' | 'experience'>('score');
  const { data: analytics, isLoading } = useCandidateAnalytics(filters);

  const handleExport = (chartType: string) => {
    if (!analytics || !onExport) return;

    let exportData;
    switch (chartType) {
      case 'score':
        exportData = analytics.scoreDistribution;
        break;
      case 'location':
        exportData = analytics.locationDistribution;
        break;
      case 'skills':
        exportData = analytics.topSkills;
        break;
      case 'experience':
        exportData = analytics.experienceDistribution;
        break;
      default:
        return;
    }

    onExport(chartType, exportData);
  };

  const chartTabs = [
    { id: 'score', label: 'Score Distribution', icon: '📊' },
    { id: 'location', label: 'Location', icon: '🌍' },
    { id: 'skills', label: 'Top Skills', icon: '🛠️' },
    { id: 'experience', label: 'Experience', icon: '⏱️' },
  ] as const;

  const renderChart = () => {
    if (!analytics) return null;

    switch (activeChart) {
      case 'score':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Score Distribution (Bar)</h4>
              <BarChart
                data={analytics.scoreDistribution}
                dataKey="count"
                xAxisKey="range"
                color="#3B82F6"
                height={300}
                showTooltip
              />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Score Distribution (Pie)</h4>
              <PieChart
                data={analytics.scoreDistribution}
                dataKey="count"
                nameKey="range"
                height={300}
                showLegend
                showTooltip
              />
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Candidates by Location</h4>
              <BarChart
                data={analytics.locationDistribution.slice(0, 10)} // Top 10 locations
                dataKey="count"
                xAxisKey="location"
                color="#10B981"
                height={300}
                showTooltip
                orientation="horizontal"
              />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Location Distribution</h4>
              <PieChart
                data={analytics.locationDistribution.slice(0, 8)} // Top 8 for better visibility
                dataKey="count"
                nameKey="location"
                height={300}
                showLegend
                showTooltip
              />
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Top Skills (Bar)</h4>
              <BarChart
                data={analytics.topSkills.slice(0, 15)} // Top 15 skills
                dataKey="count"
                xAxisKey="skill"
                color="#8B5CF6"
                height={300}
                showTooltip
                orientation="horizontal"
              />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Skills Distribution</h4>
              <PieChart
                data={analytics.topSkills.slice(0, 10)} // Top 10 for pie chart
                dataKey="count"
                nameKey="skill"
                height={300}
                showLegend
                showTooltip
              />
            </div>
          </div>
        );

      case 'experience':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Experience Distribution (Bar)</h4>
              <BarChart
                data={analytics.experienceDistribution}
                dataKey="count"
                xAxisKey="range"
                color="#F59E0B"
                height={300}
                showTooltip
              />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Experience Distribution (Pie)</h4>
              <PieChart
                data={analytics.experienceDistribution}
                dataKey="count"
                nameKey="range"
                height={300}
                showLegend
                showTooltip
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
        <h3 className="text-lg font-medium text-gray-900">Candidate Distribution</h3>
        <div className="flex items-center space-x-2">
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
              <p className="text-gray-500 font-medium">No data available</p>
              <p className="text-gray-400 text-sm mt-1">
                Analytics will appear when candidate data is available
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {analytics && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalCandidates.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Candidates</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {analytics.averageScore.toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">Average Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {analytics.topSkills.length}
              </p>
              <p className="text-sm text-gray-600">Unique Skills</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {analytics.locationDistribution.length}
              </p>
              <p className="text-sm text-gray-600">Locations</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CandidateDistributionCharts;