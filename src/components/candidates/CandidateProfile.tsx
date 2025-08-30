import React, { useState } from 'react';
import { Candidate } from '../../types';
import { Modal, Button, Badge, Card, Loading, TagInput } from '../ui';
import { useCandidate, useCandidateHistory, useUpdateCandidate, useAddCandidateTags, useRemoveCandidateTags } from '../../hooks/useCandidates';
import { formatDate, formatRelativeTime, cn } from '../../utils';
import {
  MapPinIcon,
  BriefcaseIcon,
  StarIcon,
  EnvelopeIcon,
  LinkIcon,
  AcademicCapIcon,
  ClockIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface CandidateProfileProps {
  candidateId: string;
  isOpen: boolean;
  onClose: () => void;
  onGenerateMessage?: (candidate: Candidate) => void;
  onCompare?: (candidate: Candidate) => void;
}

const CandidateProfile: React.FC<CandidateProfileProps> = ({
  candidateId,
  isOpen,
  onClose,
  onGenerateMessage,
  onCompare,
}) => {
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [newStatus, setNewStatus] = useState<Candidate['status']>('new');
  const [newTags, setNewTags] = useState<string[]>([]);

  // Fetch candidate data
  const { data: candidate, isLoading: candidateLoading, error: candidateError } = useCandidate(candidateId, isOpen);
  const { data: history = [], isLoading: historyLoading } = useCandidateHistory(candidateId, isOpen);

  // Mutations
  const updateCandidateMutation = useUpdateCandidate();
  const addTagsMutation = useAddCandidateTags();
  const removeTagsMutation = useRemoveCandidateTags();

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleStatusUpdate = async () => {
    if (!candidate) return;

    try {
      await updateCandidateMutation.mutateAsync({
        candidateId: candidate.id,
        updates: { status: newStatus },
      });
      setEditingStatus(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleTagsUpdate = async () => {
    if (!candidate) return;

    try {
      // Find tags to add and remove
      const currentTags = new Set(candidate.tags);
      const updatedTags = new Set(newTags);
      
      const tagsToAdd = newTags.filter(tag => !currentTags.has(tag));
      const tagsToRemove = candidate.tags.filter(tag => !updatedTags.has(tag));

      // Add new tags
      if (tagsToAdd.length > 0) {
        await addTagsMutation.mutateAsync({
          candidateId: candidate.id,
          tags: tagsToAdd,
        });
      }

      // Remove tags
      if (tagsToRemove.length > 0) {
        await removeTagsMutation.mutateAsync({
          candidateId: candidate.id,
          tags: tagsToRemove,
        });
      }

      setEditingTags(false);
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };

  const startEditingStatus = () => {
    if (candidate) {
      setNewStatus(candidate.status);
      setEditingStatus(true);
    }
  };

  const startEditingTags = () => {
    if (candidate) {
      setNewTags([...candidate.tags]);
      setEditingTags(true);
    }
  };

  const cancelStatusEdit = () => {
    setEditingStatus(false);
    setNewStatus(candidate?.status || 'new');
  };

  const cancelTagsEdit = () => {
    setEditingTags(false);
    setNewTags(candidate?.tags || []);
  };

  if (candidateLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading..." size="xl">
        <div className="flex items-center justify-center py-12">
          <Loading size="lg" text="Loading candidate profile..." />
        </div>
      </Modal>
    );
  }

  if (candidateError || !candidate) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Error" size="xl">
        <div className="text-center py-12">
          <div className="text-red-500">
            <p className="text-lg font-medium">Failed to load candidate profile</p>
            <p className="text-sm mt-2">
              {candidateError instanceof Error ? candidateError.message : 'An unexpected error occurred'}
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={candidate.name}
      size="xl"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-start space-x-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            {candidate.profilePicture ? (
              <img
                src={candidate.profilePicture}
                alt={candidate.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl font-medium text-gray-600">
                  {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{candidate.name}</h2>
                <p className="text-lg text-gray-600">{candidate.title}</p>
                <p className="text-gray-500">{candidate.company}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={cn('flex items-center text-2xl font-bold', getScoreColor(candidate.score))}>
                  <StarIcon className="w-6 h-6 mr-2" />
                  {candidate.score}
                </div>
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Status */}
                <div className="flex items-center space-x-2">
                  {editingStatus ? (
                    <div className="flex items-center space-x-2">
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as Candidate['status'])}
                        className="rounded-md border-gray-300 text-sm"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="responded">Responded</option>
                        <option value="interested">Interested</option>
                        <option value="not_interested">Not Interested</option>
                      </select>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<CheckIcon className="w-4 h-4" />}
                        onClick={handleStatusUpdate}
                        loading={updateCandidateMutation.isPending}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<XMarkIcon className="w-4 h-4" />}
                        onClick={cancelStatusEdit}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusVariant(candidate.status)}>
                        {candidate.status.replace('_', ' ')}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<PencilIcon className="w-4 h-4" />}
                        onClick={startEditingStatus}
                      />
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    {candidate.location}
                  </div>
                  <div className="flex items-center">
                    <BriefcaseIcon className="w-4 h-4 mr-1" />
                    {candidate.experience} years
                  </div>
                  {candidate.email && (
                    <div className="flex items-center">
                      <EnvelopeIcon className="w-4 h-4 mr-1" />
                      Email available
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<LinkIcon className="w-4 h-4" />}
                  onClick={() => window.open(candidate.linkedinUrl, '_blank')}
                >
                  LinkedIn
                </Button>
                {onGenerateMessage && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onGenerateMessage(candidate)}
                  >
                    Generate Message
                  </Button>
                )}
                {onCompare && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCompare(candidate)}
                  >
                    Compare
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        {candidate.summary && (
          <Card title="Summary">
            <p className="text-gray-700 leading-relaxed">{candidate.summary}</p>
          </Card>
        )}

        {/* Score Breakdown */}
        <Card title="Score Breakdown">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{candidate.scoreBreakdown.skillsMatch}</div>
              <div className="text-sm text-gray-500">Skills Match</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{candidate.scoreBreakdown.experienceMatch}</div>
              <div className="text-sm text-gray-500">Experience</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{candidate.scoreBreakdown.locationMatch}</div>
              <div className="text-sm text-gray-500">Location</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{candidate.scoreBreakdown.overallFit}</div>
              <div className="text-sm text-gray-500">Overall Fit</div>
            </div>
          </div>
          {candidate.scoreBreakdown.details && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">{candidate.scoreBreakdown.details}</p>
            </div>
          )}
        </Card>

        {/* Skills and Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skills */}
          <Card title="Skills">
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Tags */}
          <Card 
            title="Tags" 
            actions={
              !editingTags && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<PencilIcon className="w-4 h-4" />}
                  onClick={startEditingTags}
                />
              )
            }
          >
            {editingTags ? (
              <div className="space-y-3">
                <TagInput
                  value={newTags}
                  onChange={setNewTags}
                  placeholder="Add tags..."
                />
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleTagsUpdate}
                    loading={addTagsMutation.isPending || removeTagsMutation.isPending}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelTagsEdit}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {candidate.tags.length > 0 ? (
                  candidate.tags.map((tag, index) => (
                    <Badge key={index} variant="default">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No tags added</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Work Experience */}
        {candidate.workHistory.length > 0 && (
          <Card title="Work Experience">
            <div className="space-y-4">
              {candidate.workHistory.map((work, index) => (
                <div key={index} className="border-l-2 border-blue-200 pl-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{work.title}</h4>
                    <span className="text-sm text-gray-500">
                      {formatDate(work.startDate)} - {work.endDate ? formatDate(work.endDate) : 'Present'}
                    </span>
                  </div>
                  <p className="text-gray-600">{work.company} • {work.location}</p>
                  {work.description && (
                    <p className="text-sm text-gray-700 mt-2">{work.description}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Education */}
        {candidate.education.length > 0 && (
          <Card title="Education">
            <div className="space-y-4">
              {candidate.education.map((edu, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <AcademicCapIcon className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">{edu.degree} in {edu.field}</h4>
                    <p className="text-gray-600">{edu.institution}</p>
                    <p className="text-sm text-gray-500">
                      {edu.startYear} - {edu.endYear || 'Present'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Activity History */}
        <Card title="Activity History">
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loading size="md" text="Loading history..." />
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
                  <ClockIcon className="w-4 h-4 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{item.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">by {item.userName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No activity history available</p>
          )}
        </Card>

        {/* Metadata */}
        <div className="text-xs text-gray-500 border-t pt-4">
          <div className="flex items-center justify-between">
            <span>Added {formatRelativeTime(candidate.createdAt)}</span>
            <span>Last updated {formatRelativeTime(candidate.updatedAt)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CandidateProfile;