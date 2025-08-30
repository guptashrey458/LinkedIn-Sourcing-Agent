import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { CandidateFilters } from '../../types';

interface AnalyticsFiltersProps {
  onFiltersChange: (filters: CandidateFilters) => void;
  onDateRangeChange: (dateRange: [Date, Date] | undefined) => void;
  onExportAll: () => void;
  className?: string;
}

const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  onFiltersChange,
  onDateRangeChange,
  onExportAll,
  className,
}) => {
  const [filters, setFilters] = useState<CandidateFilters>({});
  const [dateRange, setDateRange] = useState<[Date, Date] | undefined>();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof CandidateFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const newDateRange: [Date, Date] = [startDate, endDate];
      setDateRange(newDateRange);
      onDateRangeChange(newDateRange);
    } else {
      setDateRange(undefined);
      onDateRangeChange(undefined);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setDateRange(undefined);
    onFiltersChange({});
    onDateRangeChange(undefined);
  };

  const presetDateRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Last 6 months', days: 180 },
    { label: 'Last year', days: 365 },
  ];

  const applyPresetDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const newDateRange: [Date, Date] = [startDate, endDate];
    setDateRange(newDateRange);
    onDateRangeChange(newDateRange);
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Analytics Filters</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Simple' : 'Advanced'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onExportAll}
          >
            Export All
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {presetDateRanges.map((preset) => (
              <button
                key={preset.days}
                onClick={() => applyPresetDateRange(preset.days)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange ? formatDateForInput(dateRange[0]) : ''}
                onChange={(e) => handleDateRangeChange(e.target.value, dateRange ? formatDateForInput(dateRange[1]) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange ? formatDateForInput(dateRange[1]) : ''}
                onChange={(e) => handleDateRangeChange(dateRange ? formatDateForInput(dateRange[0]) : '', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search candidates..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status?.[0] || ''}
              onChange={(e) => handleFilterChange('status', e.target.value ? [e.target.value] : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="responded">Responded</option>
              <option value="interested">Interested</option>
              <option value="not_interested">Not Interested</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              placeholder="Enter location..."
              value={filters.location?.[0] || ''}
              onChange={(e) => handleFilterChange('location', e.target.value ? [e.target.value] : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    min="0"
                    max="100"
                    value={filters.scoreRange?.[0] || ''}
                    onChange={(e) => {
                      const min = e.target.value ? parseInt(e.target.value) : undefined;
                      const max = filters.scoreRange?.[1];
                      handleFilterChange('scoreRange', min !== undefined || max !== undefined ? [min || 0, max || 100] : undefined);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    min="0"
                    max="100"
                    value={filters.scoreRange?.[1] || ''}
                    onChange={(e) => {
                      const max = e.target.value ? parseInt(e.target.value) : undefined;
                      const min = filters.scoreRange?.[0];
                      handleFilterChange('scoreRange', min !== undefined || max !== undefined ? [min || 0, max || 100] : undefined);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Range (years)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    min="0"
                    value={filters.experience?.[0] || ''}
                    onChange={(e) => {
                      const min = e.target.value ? parseInt(e.target.value) : undefined;
                      const max = filters.experience?.[1];
                      handleFilterChange('experience', min !== undefined || max !== undefined ? [min || 0, max || 50] : undefined);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    min="0"
                    value={filters.experience?.[1] || ''}
                    onChange={(e) => {
                      const max = e.target.value ? parseInt(e.target.value) : undefined;
                      const min = filters.experience?.[0];
                      handleFilterChange('experience', min !== undefined || max !== undefined ? [min || 0, max || 50] : undefined);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="React, TypeScript, Node.js..."
                  value={filters.skills?.join(', ') || ''}
                  onChange={(e) => {
                    const skills = e.target.value
                      .split(',')
                      .map(skill => skill.trim())
                      .filter(skill => skill.length > 0);
                    handleFilterChange('skills', skills.length > 0 ? skills : undefined);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Filter Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {Object.keys(filters).filter(key => filters[key as keyof CandidateFilters] !== undefined).length > 0 || dateRange
              ? `${Object.keys(filters).filter(key => filters[key as keyof CandidateFilters] !== undefined).length + (dateRange ? 1 : 0)} filter(s) applied`
              : 'No filters applied'
            }
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={Object.keys(filters).filter(key => filters[key as keyof CandidateFilters] !== undefined).length === 0 && !dateRange}
          >
            Clear All
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AnalyticsFilters;