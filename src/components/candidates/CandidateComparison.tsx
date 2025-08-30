import React from 'react';
import { Candidate } from '../../types';
import { Modal, Button, Badge, Card, Loading } from '../ui';
import { useCompareCandidates } from '../../hooks/useCandidates';
import { cn } from '../../utils';
import {
  StarIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface CandidateComparisonProps {
  candidateIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onViewProfile?: (candidate: Candidate) => void;
  onGenerateMessage?: (candidate: Candidate) => void;
}

const CandidateComparison: React.FC<CandidateComparisonProps> = ({
  candidateIds,
  isOpen,
  onClose,
  onViewProfile,
  onGenerateMessage,
}) => {
  const { data: comparisonData, isLoading, error } = useCompareCandidates(candidateIds, isOpen && candidateIds.length > 1);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusVariant = (status: Candidate['status']) => {
    switch (status) {
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
  };

  if (candidateIds.length < 2) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Compare Candidates" size="xl">
        <div className="text-center py-12">
          <p className="text-gray-500">Please select at least 2 candidates to compare.</p>
        </div>
      </Modal>
    );
  }

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Compare Candidates" size="xl">
        <div className="flex items-center justify-center py-12">
          <Loading size="lg" text="Loading comparison..." />
        </div>
      </Modal>
    );
  }

  if (error || !comparisonData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Compare Candidates" size="xl">
        <div className="text-center py-12">
          <div className="text-red-500">
            <p className="text-lg font-medium">Failed to load comparison</p>
            <p className="text-sm mt-2">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  const { candidates, comparison } = comparisonData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Compare ${candidates.length} Candidates`}
      size="full"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6">
        {/* Candidate Headers */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${candidates.length}, 1fr)` }}>
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="text-center">
              <div className="space-y-3">
                {/* Profile Picture */}
                <div className="flex justify-center">
                  {candidate.profilePicture ? (
                    <img
                      src={candidate.profilePicture}
                      alt={candidate.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-600">
                        {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div>
                  <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                  <p className="text-sm text-gray-600">{candidate.title}</p>
                  <p className="text-xs text-gray-500">{candidate.company}</p>
                </div>

                {/* Score */}
                <div className={cn('flex items-center justify-center text-xl font-bold', getScoreColor(candidate.score))}>
                  <StarIcon className="w-5 h-5 mr-1" />
                  {candidate.score}
                </div>

                {/* Status */}
                <Badge variant={getStatusVariant(candidate.status)} size="sm">
                  {candidate.status.replace('_', ' ')}
                </Badge>

                {/* Actions */}
                <div className="flex justify-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewProfile?.(candidate)}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onGenerateMessage?.(candidate)}
                  >
                    Message
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Score Comparison */}
        <Card title="Score Breakdown">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Metric</th>
                  {candidates.map((candidate) => (
                    <th key={candidate.id} className="text-center py-2 px-3 font-medium text-gray-900">
                      {candidate.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-700">Overall Score</td>
                  {comparison.scores.map((score) => (
                    <td key={score.id} className="text-center py-2 px-3">
                      <span className={cn('font-bold', getScoreColor(score.score))}>
                        {score.score}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-700">Skills Match</td>
                  {comparison.scores.map((score) => (
                    <td key={score.id} className="text-center py-2 px-3">
                      <span className="font-medium text-blue-600">
                        {score.breakdown.skillsMatch}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-700">Experience Match</td>
                  {comparison.scores.map((score) => (
                    <td key={score.id} className="text-center py-2 px-3">
                      <span className="font-medium text-green-600">
                        {score.breakdown.experienceMatch}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-700">Location Match</td>
                  {comparison.scores.map((score) => (
                    <td key={score.id} className="text-center py-2 px-3">
                      <span className="font-medium text-purple-600">
                        {score.breakdown.locationMatch}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Experience Comparison */}
        <Card title="Experience">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Candidate</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-900">Years</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Location</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Current Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comparison.experience.map((exp) => {
                  const candidate = candidates.find(c => c.id === exp.id);
                  return (
                    <tr key={exp.id}>
                      <td className="py-2 px-3 font-medium text-gray-900">
                        {candidate?.name}
                      </td>
                      <td className="text-center py-2 px-3">
                        <div className="flex items-center justify-center">
                          <BriefcaseIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {exp.experience}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {comparison.locations.find(l => l.id === exp.id)?.location}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-gray-700">
                        {candidate?.title} at {candidate?.company}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Skills Comparison */}
        <Card title="Skills Comparison">
          <div className="space-y-4">
            {comparison.skills.slice(0, 10).map((skillComparison) => (
              <div key={skillComparison.skill} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{skillComparison.skill}</h4>
                  <span className="text-sm text-gray-500">
                    {skillComparison.candidates.filter(c => c.hasSkill).length} of {skillComparison.candidates.length}
                  </span>
                </div>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${candidates.length}, 1fr)` }}>
                  {skillComparison.candidates.map((candidateSkill) => {
                    const candidate = candidates.find(c => c.id === candidateSkill.id);
                    return (
                      <div key={candidateSkill.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700 truncate">
                          {candidate?.name}
                        </span>
                        {candidateSkill.hasSkill ? (
                          <CheckIcon className="w-4 h-4 text-green-500" />
                        ) : (
                          <XMarkIcon className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Education Comparison */}
        <Card title="Education">
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="border-l-2 border-blue-200 pl-4">
                <h4 className="font-medium text-gray-900 mb-2">{candidate.name}</h4>
                {candidate.education.length > 0 ? (
                  <div className="space-y-2">
                    {candidate.education.map((edu, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AcademicCapIcon className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {edu.degree} in {edu.field}
                          </p>
                          <p className="text-xs text-gray-600">
                            {edu.institution} ({edu.startYear} - {edu.endYear || 'Present'})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No education information available</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default CandidateComparison;