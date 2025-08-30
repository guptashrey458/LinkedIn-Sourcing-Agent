import React, { useState, useMemo, useCallback } from 'react';
import { Candidate, CandidateFilters as CandidateFiltersType } from '../../types';
import { useInfiniteCandidates } from '../../hooks/useCandidates';
import { Button } from '../ui';
import CandidateFilters from './CandidateFilters';
import CandidateSort from './CandidateSort';
import VirtualizedCandidateList from './VirtualizedCandidateList';
import { debounce } from '../../utils';
import {
  AdjustmentsHorizontalIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

export interface CandidateListProps {
  onCandidateSelect?: (candidate: Candidate) => void;
  onViewProfile?: (candidate: Candidate) => void;
  onGenerateMessage?: (candidate: Candidate) => void;
  selectedCandidates?: Set<string>;
  selectable?: boolean;
  className?: string;
}

type ViewMode = 'list' | 'grid' | 'compact';

const CandidateList: React.FC<CandidateListProps> = ({
  onCandidateSelect,
  onViewProfile,
  onGenerateMessage,
  selectedCandidates,
  selectable = false,
  className,
}) => {
  const [filters, setFilters] = useState<CandidateFiltersType>({});
  const [sortBy, setSortBy] = useState<keyof Candidate>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Debounced filter change to avoid too many API calls
  const debouncedSetFilters = useMemo(
    () => debounce((newFilters: CandidateFiltersType) => {
      setFilters(newFilters);
    }, 300),
    []
  );

  // Build search params for the API
  const searchParams = useMemo(() => ({
    ...filters,
    sortBy,
    sortOrder,
    limit: 50, // Load 50 candidates per page for virtual scrolling
  }), [filters, sortBy, sortOrder]);

  // Fetch candidates with infinite query for pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteCandidates(searchParams);

  // Flatten all pages into a single array
  const candidates = useMemo(() => {
    return data?.pages.flatMap(page => page.candidates) || [];
  }, [data]);

  const handleFiltersChange = useCallback((newFilters: CandidateFiltersType) => {
    debouncedSetFilters(newFilters);
  }, [debouncedSetFilters]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleSortChange = useCallback((newSortBy: keyof Candidate, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getItemHeight = () => {
    switch (viewMode) {
      case 'compact':
        return 120;
      case 'grid':
        return 280;
      default:
        return 200;
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.scoreRange) count++;
    if (filters.experience) count++;
    if (filters.location?.length) count++;
    if (filters.skills?.length) count++;
    if (filters.status?.length) count++;
    return count;
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading candidates</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            size="sm"
            icon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
            {getActiveFiltersCount() > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-0.5">
                {getActiveFiltersCount()}
              </span>
            )}
          </Button>

          <CandidateSort
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="List View"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid View"
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 ${
                viewMode === 'compact'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Compact View"
            >
              <ViewColumnsIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-500">
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
            {data?.pages[0]?.total && (
              <span> of {data.pages[0].total}</span>
            )}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <CandidateFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* Candidate List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <VirtualizedCandidateList
          candidates={candidates}
          loading={isLoading}
          onCandidateSelect={onCandidateSelect}
          onViewProfile={onViewProfile}
          onGenerateMessage={onGenerateMessage}
          selectedCandidates={selectedCandidates}
          selectable={selectable}
          height={600}
          itemHeight={getItemHeight()}
        />

        {/* Load More Button */}
        {hasNextPage && (
          <div className="p-4 border-t border-gray-200 text-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              loading={isFetchingNextPage}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Loading...' : 'Load More Candidates'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateList;