import React, { useState } from 'react';
import { 
  CandidateDistributionCharts, 
  PipelinePerformanceCharts, 
  AnalyticsFilters 
} from '../../components/analytics';
import { Button } from '../../components/ui';
import { CandidateFilters } from '../../types';

const Analytics: React.FC = () => {
  const [candidateFilters, setCandidateFilters] = useState<CandidateFilters>({});
  const [dateRange, setDateRange] = useState<[Date, Date] | undefined>();

  const handleExportChart = (chartType: string, data: any) => {
    // Create a downloadable file with the chart data
    const exportData = {
      chartType,
      data,
      exportedAt: new Date().toISOString(),
      filters: candidateFilters,
      dateRange,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${chartType}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    // This would typically trigger exports of all charts
    console.log('Exporting all analytics data...');
    
    // For now, just show a notification
    alert('Export all functionality would be implemented here. This would generate a comprehensive report with all charts and data.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Comprehensive insights into candidate sourcing performance and pipeline analytics.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <AnalyticsFilters
            onFiltersChange={setCandidateFilters}
            onDateRangeChange={setDateRange}
            onExportAll={handleExportAll}
          />
        </div>

        {/* Analytics Charts */}
        <div className="space-y-8">
          {/* Candidate Distribution Charts */}
          <CandidateDistributionCharts
            filters={candidateFilters}
            onExport={handleExportChart}
          />

          {/* Pipeline Performance Charts */}
          <PipelinePerformanceCharts
            dateRange={dateRange}
            onExport={handleExportChart}
          />
        </div>

        {/* Additional Insights Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Insights Card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Top Performing Skills</p>
                  <p className="text-sm text-gray-600">
                    React, TypeScript, and Node.js are the most in-demand skills among sourced candidates.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Geographic Distribution</p>
                  <p className="text-sm text-gray-600">
                    San Francisco Bay Area and New York City account for 45% of all candidates.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Pipeline Efficiency</p>
                  <p className="text-sm text-gray-600">
                    Discovery stage has the highest success rate at 92%, while scoring stage needs optimization.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">Optimize Scoring Algorithm</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Consider adjusting scoring weights to improve candidate quality metrics.
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Expand Geographic Reach</p>
                <p className="text-sm text-blue-700 mt-1">
                  Explore remote-friendly positions to access talent in emerging tech hubs.
                </p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">Leverage High-Performing Skills</p>
                <p className="text-sm text-green-700 mt-1">
                  Focus job descriptions on React and TypeScript to attract top candidates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Export Summary */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Export Options</h3>
              <p className="text-sm text-gray-600 mt-1">
                Download analytics data in various formats for further analysis or reporting.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportChart('summary', {
                  candidateFilters,
                  dateRange,
                  exportType: 'csv'
                })}
              >
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportChart('summary', {
                  candidateFilters,
                  dateRange,
                  exportType: 'excel'
                })}
              >
                Export Excel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExportAll}
              >
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;