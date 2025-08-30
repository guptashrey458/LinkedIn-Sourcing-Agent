import React, { memo, useMemo } from 'react';
import { Candidate } from '../../types';
import { Badge, Button, Card, LazyImage } from '../ui';
import { cn, formatRelativeTime, truncateText } from '../../utils';
import { 
  MapPinIcon, 
  BriefcaseIcon, 
  StarIcon, 
  EnvelopeIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export interface CandidateCardProps {
  candidate: Candidate;
  onSelect?: (candidate: Candidate) => void;
  onViewProfile?: (candidate: Candidate) => void;
  onGenerateMessage?: (candidate: Candidate) => void;
  showActions?: boolean;
  compact?: boolean;
  selected?: boolean;
  selectable?: boolean;
}

const CandidateCard: React.FC<CandidateCardProps> = memo(({
  candidate,
  onSelect,
  onViewProfile,
  onGenerateMessage,
  showActions = true,
  compact = false,
  selected = false,
  selectable = false,
}) => {
  const statusVariant = useMemo(() => {
    switch (candidate.status) {
      case 'new':
        return 'info';
      case 'contacted':
        return 'warning';
      case 'responded':
        return 'success';
      case 'interested':
        return 'success';
      case 'not_interested':
        return 'error';
      default:
        return 'default';
    }
  }, [candidate.status]);

  const scoreColor = useMemo(() => {
    if (candidate.score >= 80) return 'text-green-600';
    if (candidate.score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, [candidate.score]);

  const initials = useMemo(() => {
    return candidate.name.split(' ').map(n => n[0]).join('').toUpperCase();
  }, [candidate.name]);

  const truncatedSummary = useMemo(() => {
    return candidate.summary ? truncateText(candidate.summary, 120) : null;
  }, [candidate.summary]);

  const displayedSkills = useMemo(() => {
    return candidate.skills.slice(0, 5);
  }, [candidate.skills]);

  const additionalSkillsCount = useMemo(() => {
    return Math.max(0, candidate.skills.length - 5);
  }, [candidate.skills.length]);

  const handleCardClick = () => {
    if (selectable && onSelect) {
      onSelect(candidate);
    }
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md',
        selectable && 'cursor-pointer hover:bg-gray-50',
        selected && 'ring-2 ring-blue-500 bg-blue-50',
        compact ? 'p-4' : 'p-6'
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {selectable && (
            <div className="flex items-center pt-1">
              <div
                className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center',
                  selected
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300 hover:border-blue-400'
                )}
              >
                {selected && (
                  <CheckIcon className="w-3 h-3 text-white" />
                )}
              </div>
            </div>
          )}

          {/* Profile Picture */}
          <div className="flex-shrink-0">
            {candidate.profilePicture ? (
              <LazyImage
                src={candidate.profilePicture}
                alt={candidate.name}
                className={cn(
                  'rounded-full object-cover',
                  compact ? 'w-10 h-10' : 'w-12 h-12'
                )}
                fallback={
                  <div
                    className={cn(
                      'rounded-full bg-gray-200 flex items-center justify-center',
                      compact ? 'w-10 h-10' : 'w-12 h-12'
                    )}
                  >
                    <span className={cn(
                      'font-medium text-gray-600',
                      compact ? 'text-sm' : 'text-base'
                    )}>
                      {initials}
                    </span>
                  </div>
                }
              />
            ) : (
              <div
                className={cn(
                  'rounded-full bg-gray-200 flex items-center justify-center',
                  compact ? 'w-10 h-10' : 'w-12 h-12'
                )}
              >
                <span className={cn(
                  'font-medium text-gray-600',
                  compact ? 'text-sm' : 'text-base'
                )}>
                  {initials}
                </span>
              </div>
            )}
          </div>

          {/* Candidate Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className={cn(
                'font-semibold text-gray-900 truncate',
                compact ? 'text-sm' : 'text-base'
              )}>
                {candidate.name}
              </h3>
              <div className="flex items-center space-x-2 ml-4">
                <div className={cn(
                  'flex items-center',
                  scoreColor
                )}>
                  <StarIcon className="w-4 h-4 mr-1" />
                  <span className="font-medium">{candidate.score}</span>
                </div>
                <Badge variant={statusVariant} size="sm">
                  {candidate.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <p className={cn(
              'text-gray-600 mb-2',
              compact ? 'text-xs' : 'text-sm'
            )}>
              {candidate.title} at {candidate.company}
            </p>

            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center text-gray-500">
                <MapPinIcon className="w-4 h-4 mr-1" />
                <span className={compact ? 'text-xs' : 'text-sm'}>
                  {candidate.location}
                </span>
              </div>
              <div className="flex items-center text-gray-500">
                <BriefcaseIcon className="w-4 h-4 mr-1" />
                <span className={compact ? 'text-xs' : 'text-sm'}>
                  {candidate.experience} years
                </span>
              </div>
            </div>

            {!compact && (
              <>
                {/* Summary */}
                {truncatedSummary && (
                  <p className="text-sm text-gray-600 mb-3">
                    {truncatedSummary}
                  </p>
                )}

                {/* Skills */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {displayedSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" size="sm">
                      {skill}
                    </Badge>
                  ))}
                  {additionalSkillsCount > 0 && (
                    <Badge variant="default" size="sm">
                      +{additionalSkillsCount} more
                    </Badge>
                  )}
                </div>

                {/* Tags */}
                {candidate.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {candidate.tags.map((tag, index) => (
                      <Badge key={index} variant="default" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Added {formatRelativeTime(candidate.createdAt)}</span>
              {candidate.email && (
                <div className="flex items-center">
                  <EnvelopeIcon className="w-3 h-3 mr-1" />
                  <span>Email available</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && !selectable && (
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              icon={<EyeIcon className="w-4 h-4" />}
              onClick={(e) => {
                e?.stopPropagation();
                onViewProfile?.(candidate);
              }}
              title="View Profile"
            />
            <Button
              variant="ghost"
              size="sm"
              icon={<ChatBubbleLeftRightIcon className="w-4 h-4" />}
              onClick={(e) => {
                e?.stopPropagation();
                onGenerateMessage?.(candidate);
              }}
              title="Generate Message"
            />
          </div>
        )}
      </div>
    </Card>
  );
});

CandidateCard.displayName = 'CandidateCard';

export default CandidateCard;