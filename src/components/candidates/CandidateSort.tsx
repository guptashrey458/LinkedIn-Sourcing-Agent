import React from 'react';
import { Candidate } from '../../types';
import { Select } from '../ui';
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';

export interface CandidateSortProps {
  sortBy: keyof Candidate;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: keyof Candidate, sortOrder: 'asc' | 'desc') => void;
  className?: string;
}

const CandidateSort: React.FC<CandidateSortProps> = ({
  sortBy,
  sortOrder,
  onSortChange,
  className,
}) => {
  const sortOptions = [
    { value: 'score', label: 'Score' },
    { value: 'name', label: 'Name' },
    { value: 'experience', label: 'Experience' },
    { value: 'createdAt', label: 'Date Added' },
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'location', label: 'Location' },
    { value: 'title', label: 'Job Title' },
    { value: 'company', label: 'Company' },
  ];

  const handleSortByChange = (value: string) => {
    onSortChange(value as keyof Candidate, sortOrder);
  };

  const handleSortOrderToggle = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center text-gray-500">
        <Bars3BottomLeftIcon className="w-4 h-4 mr-2" />
        <span className="text-sm font-medium">Sort by:</span>
      </div>
      
      <div className="flex items-center space-x-1">
        <Select
          options={sortOptions}
          value={sortBy}
          onChange={(e) => handleSortByChange(e.target.value)}
          className="min-w-[120px]"
        />
        
        <button
          onClick={handleSortOrderToggle}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
        >
          {sortOrder === 'asc' ? (
            <ArrowUpIcon className="w-4 h-4" />
          ) : (
            <ArrowDownIcon className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default CandidateSort;