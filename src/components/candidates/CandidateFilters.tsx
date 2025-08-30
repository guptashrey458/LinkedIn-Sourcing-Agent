import React, { useState, useEffect } from 'react';
import { CandidateFilters as CandidateFiltersType, Candidate } from '../../types';
import { Button, Input, Badge } from '../ui';
import { useCandidateSkills, useCandidateLocations } from '../../hooks/useCandidates';
import { cn } from '../../utils';
import {
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

export interface CandidateFiltersProps {
  filters: CandidateFiltersType;
  onFiltersChange: (filters: CandidateFiltersType) => void;
  onClearFilters: () => void;
  className?: string;
  compact?: boolean;
}

const CandidateFilters: React.FC<CandidateFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [localFilters, setLocalFilters] = useState<CandidateFiltersType>(filters);

  // Fetch filter options
  const { data: skills = [] } = useCandidateSkills();
  const { data: locations = [] } = useCandidateLocations();

  // Status options
  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'responded', label: 'Responded' },
    { value: 'interested', label: 'Interested' },
    { value: 'not_interested', label: 'Not Interested' },
  ];

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof CandidateFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleScoreRangeChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    const currentRange = localFilters.scoreRange || [0, 100];
    const newRange: [number, number] = type === 'min' 
      ? [numValue || 0, currentRange[1]]
      : [currentRange[0], numValue || 100];
    
    handleFilterChange('scoreRange', newRange);
  };

  const handleExperienceRangeChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    const currentRange = localFilters.experience || [0, 50];
    const newRange: [number, number] = type === 'min' 
      ? [numValue || 0, currentRange[1]]
      : [currentRange[0], numValue || 50];
    
    handleFilterChange('experience', newRange);
  };

  const handleMultiSelectChange = (
    key: 'location' | 'skills' | 'status',
    value: string,
    checked: boolean
  ) => {
    const currentValues = localFilters[key] || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    handleFilterChange(key, newValues.length > 0 ? newValues : undefined);
  };

  const removeFilter = (key: keyof CandidateFiltersType, value?: string) => {
    if (value && Array.isArray(localFilters[key])) {
      const currentValues = localFilters[key] as string[];
      const newValues = currentValues.filter(v => v !== value);
      handleFilterChange(key, newValues.length > 0 ? newValues : undefined);
    } else {
      handleFilterChange(key, undefined);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.search) count++;
    if (localFilters.scoreRange) count++;
    if (localFilters.experience) count++;
    if (localFilters.location?.length) count++;
    if (localFilters.skills?.length) count++;
    if (localFilters.status?.length) count++;
    return count;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <Badge variant="info" size="sm">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
            >
              Clear All
            </Button>
          )}
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              icon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {localFilters.search && (
              <Badge variant="info" className="flex items-center gap-1">
                Search: {localFilters.search}
                <button
                  onClick={() => removeFilter('search')}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {localFilters.scoreRange && (
              <Badge variant="info" className="flex items-center gap-1">
                Score: {localFilters.scoreRange[0]}-{localFilters.scoreRange[1]}
                <button
                  onClick={() => removeFilter('scoreRange')}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {localFilters.experience && (
              <Badge variant="info" className="flex items-center gap-1">
                Experience: {localFilters.experience[0]}-{localFilters.experience[1]} years
                <button
                  onClick={() => removeFilter('experience')}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {localFilters.location?.map(location => (
              <Badge key={location} variant="info" className="flex items-center gap-1">
                Location: {location}
                <button
                  onClick={() => removeFilter('location', location)}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            
            {localFilters.skills?.map(skill => (
              <Badge key={skill} variant="info" className="flex items-center gap-1">
                Skill: {skill}
                <button
                  onClick={() => removeFilter('skills', skill)}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            
            {localFilters.status?.map(status => (
              <Badge key={status} variant="info" className="flex items-center gap-1">
                Status: {status.replace('_', ' ')}
                <button
                  onClick={() => removeFilter('status', status)}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Filter Controls */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Search */}
          <div>
            <Input
              label="Search"
              placeholder="Search candidates by name, title, company..."
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
              leftIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
            />
          </div>

          {/* Score Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Score Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min (0)"
                min="0"
                max="100"
                value={localFilters.scoreRange?.[0] || ''}
                onChange={(e) => handleScoreRangeChange('min', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max (100)"
                min="0"
                max="100"
                value={localFilters.scoreRange?.[1] || ''}
                onChange={(e) => handleScoreRangeChange('max', e.target.value)}
              />
            </div>
          </div>

          {/* Experience Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience (Years)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min (0)"
                min="0"
                max="50"
                value={localFilters.experience?.[0] || ''}
                onChange={(e) => handleExperienceRangeChange('min', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max (50)"
                min="0"
                max="50"
                value={localFilters.experience?.[1] || ''}
                onChange={(e) => handleExperienceRangeChange('max', e.target.value)}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="space-y-2">
              {statusOptions.map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.status?.includes(option.value as Candidate['status']) || false}
                    onChange={(e) => handleMultiSelectChange('status', option.value, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Locations */}
          {locations.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locations
              </label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {locations.slice(0, 10).map(location => (
                  <label key={location} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localFilters.location?.includes(location) || false}
                      onChange={(e) => handleMultiSelectChange('location', location, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{location}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {skills.slice(0, 15).map(skill => (
                  <label key={skill} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localFilters.skills?.includes(skill) || false}
                      onChange={(e) => handleMultiSelectChange('skills', skill, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{skill}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CandidateFilters;