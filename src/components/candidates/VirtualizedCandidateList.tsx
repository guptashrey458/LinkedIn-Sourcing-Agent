import React, { useMemo, useCallback, memo } from 'react';
// @ts-ignore - react-window types issue
import * as ReactWindow from 'react-window';
const List = ReactWindow.FixedSizeList;
import { Candidate } from '../../types';
import CandidateCard from './CandidateCard';
import { Loading } from '../ui';

export interface VirtualizedCandidateListProps {
  candidates: Candidate[];
  loading?: boolean;
  onCandidateSelect?: (candidate: Candidate) => void;
  onViewProfile?: (candidate: Candidate) => void;
  onGenerateMessage?: (candidate: Candidate) => void;
  selectedCandidates?: Set<string>;
  selectable?: boolean;
  height?: number;
  itemHeight?: number;
  className?: string;
}

interface ListItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    candidates: Candidate[];
    onCandidateSelect?: (candidate: Candidate) => void;
    onViewProfile?: (candidate: Candidate) => void;
    onGenerateMessage?: (candidate: Candidate) => void;
    selectedCandidates?: Set<string>;
    selectable?: boolean;
  };
}

const ListItem: React.FC<ListItemProps> = memo(({ index, style, data }) => {
  const {
    candidates,
    onCandidateSelect,
    onViewProfile,
    onGenerateMessage,
    selectedCandidates,
    selectable,
  } = data;

  const candidate = candidates[index];
  const isSelected = selectedCandidates?.has(candidate.id) || false;

  return (
    <div style={style} className="px-4 py-2">
      <CandidateCard
        candidate={candidate}
        onSelect={onCandidateSelect}
        onViewProfile={onViewProfile}
        onGenerateMessage={onGenerateMessage}
        selected={isSelected}
        selectable={selectable}
        showActions={!selectable}
      />
    </div>
  );
});

ListItem.displayName = 'ListItem';

const VirtualizedCandidateList: React.FC<VirtualizedCandidateListProps> = memo(({
  candidates,
  loading = false,
  onCandidateSelect,
  onViewProfile,
  onGenerateMessage,
  selectedCandidates,
  selectable = false,
  height = 600,
  itemHeight = 200,
  className,
}) => {
  const itemData = useMemo(() => ({
    candidates,
    onCandidateSelect,
    onViewProfile,
    onGenerateMessage,
    selectedCandidates,
    selectable,
  }), [
    candidates,
    onCandidateSelect,
    onViewProfile,
    onGenerateMessage,
    selectedCandidates,
    selectable,
  ]);

  const getItemKey = useCallback((index: number) => {
    return candidates[index]?.id || index;
  }, [candidates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" text="Loading candidates..." />
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or search criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <List
        height={height}
        itemCount={candidates.length}
        itemSize={itemHeight}
        itemData={itemData}
        itemKey={getItemKey}
        overscanCount={5}
      >
        {ListItem}
      </List>
    </div>
  );
});

VirtualizedCandidateList.displayName = 'VirtualizedCandidateList';

export default VirtualizedCandidateList;