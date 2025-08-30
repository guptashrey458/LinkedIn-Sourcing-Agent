import React, { useState } from 'react';
import { Candidate } from '../../types';
import { Button, Modal, Select, TagInput } from '../ui';
import { 
  useBulkUpdateCandidates, 
  useBulkDeleteCandidates, 
  useExportCandidates,
  useCandidateTags 
} from '../../hooks/useCandidates';
import {
  DocumentArrowDownIcon,
  TagIcon,
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export interface BulkActionsMenuProps {
  selectedCandidateIds: string[];
  onClose: () => void;
  onSuccess?: () => void;
  className?: string;
}

type BulkAction = 'export' | 'tag' | 'status' | 'message' | 'delete';

const BulkActionsMenu: React.FC<BulkActionsMenuProps> = ({
  selectedCandidateIds,
  onClose,
  onSuccess,
  className,
}) => {
  const [activeAction, setActiveAction] = useState<BulkAction | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'json'>('csv');
  const [exportFields, setExportFields] = useState<string[]>([
    'name', 'email', 'title', 'company', 'location', 'score', 'status'
  ]);
  const [newStatus, setNewStatus] = useState<Candidate['status']>('contacted');
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [messageTemplate, setMessageTemplate] = useState('');

  // Fetch available tags for suggestions
  const { data: availableTags = [] } = useCandidateTags();

  // Mutations
  const bulkUpdateMutation = useBulkUpdateCandidates();
  const bulkDeleteMutation = useBulkDeleteCandidates();
  const exportMutation = useExportCandidates();

  const exportFieldOptions = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'title', label: 'Job Title' },
    { value: 'company', label: 'Company' },
    { value: 'location', label: 'Location' },
    { value: 'score', label: 'Score' },
    { value: 'status', label: 'Status' },
    { value: 'skills', label: 'Skills' },
    { value: 'experience', label: 'Experience' },
    { value: 'summary', label: 'Summary' },
    { value: 'linkedinUrl', label: 'LinkedIn URL' },
    { value: 'tags', label: 'Tags' },
    { value: 'createdAt', label: 'Date Added' },
    { value: 'updatedAt', label: 'Last Updated' },
  ];

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'responded', label: 'Responded' },
    { value: 'interested', label: 'Interested' },
    { value: 'not_interested', label: 'Not Interested' },
  ];

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync({
        candidateIds: selectedCandidateIds,
        format: exportFormat,
        fields: exportFields,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await bulkUpdateMutation.mutateAsync({
        candidateIds: selectedCandidateIds,
        updates: { status: newStatus },
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  const handleTagsAdd = async () => {
    if (tagsToAdd.length === 0) return;

    try {
      // Note: This would need to be implemented as a bulk tag operation in the backend
      // For now, we'll use the bulk update to add tags
      await bulkUpdateMutation.mutateAsync({
        candidateIds: selectedCandidateIds,
        updates: { tags: tagsToAdd },
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Tag update failed:', error);
    }
  };

  const handleBulkMessage = () => {
    // TODO: Implement bulk messaging functionality
    console.log('Bulk message:', { candidateIds: selectedCandidateIds, template: messageTemplate });
    onSuccess?.();
    onClose();
  };

  const handleDelete = async () => {
    try {
      await bulkDeleteMutation.mutateAsync(selectedCandidateIds);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const renderActionContent = () => {
    switch (activeAction) {
      case 'export':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <Select
                options={[
                  { value: 'csv', label: 'CSV' },
                  { value: 'excel', label: 'Excel' },
                  { value: 'json', label: 'JSON' },
                ]}
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'csv' | 'excel' | 'json')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fields to Export
              </label>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-300 rounded-md p-3">
                {exportFieldOptions.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportFields.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExportFields([...exportFields, option.value]);
                        } else {
                          setExportFields(exportFields.filter(f => f !== option.value));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setActiveAction(null)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleExport}
                loading={exportMutation.isPending}
                disabled={exportFields.length === 0}
              >
                Export {selectedCandidateIds.length} Candidates
              </Button>
            </div>
          </div>
        );

      case 'status':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <Select
                options={statusOptions}
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as Candidate['status'])}
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    This will update the status for all {selectedCandidateIds.length} selected candidates.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setActiveAction(null)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleStatusUpdate}
                loading={bulkUpdateMutation.isPending}
              >
                Update Status
              </Button>
            </div>
          </div>
        );

      case 'tag':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Tags
              </label>
              <TagInput
                value={tagsToAdd}
                onChange={setTagsToAdd}
                placeholder="Add tags..."
                suggestions={availableTags}
              />
              <p className="text-sm text-gray-500 mt-1">
                These tags will be added to all selected candidates.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setActiveAction(null)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleTagsAdd}
                loading={bulkUpdateMutation.isPending}
                disabled={tagsToAdd.length === 0}
              >
                Add Tags
              </Button>
            </div>
          </div>
        );

      case 'message':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Template
              </label>
              <textarea
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="Enter your message template here..."
                rows={6}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                You can use variables like {'{name}'}, {'{title}'}, {'{company}'} in your template.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-700">
                This will generate personalized messages for all {selectedCandidateIds.length} selected candidates.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setActiveAction(null)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleBulkMessage}
                disabled={!messageTemplate.trim()}
              >
                Generate Messages
              </Button>
            </div>
          </div>
        );

      case 'delete':
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Delete Candidates
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Are you sure you want to delete {selectedCandidateIds.length} candidates? 
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setActiveAction(null)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDelete}
                loading={bulkDeleteMutation.isPending}
              >
                Delete {selectedCandidateIds.length} Candidates
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="flex flex-col items-center p-6 h-auto"
              onClick={() => setActiveAction('export')}
            >
              <DocumentArrowDownIcon className="w-8 h-8 mb-2 text-gray-600" />
              <span className="font-medium">Export</span>
              <span className="text-sm text-gray-500">Download candidate data</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center p-6 h-auto"
              onClick={() => setActiveAction('status')}
            >
              <PencilSquareIcon className="w-8 h-8 mb-2 text-gray-600" />
              <span className="font-medium">Update Status</span>
              <span className="text-sm text-gray-500">Change candidate status</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center p-6 h-auto"
              onClick={() => setActiveAction('tag')}
            >
              <TagIcon className="w-8 h-8 mb-2 text-gray-600" />
              <span className="font-medium">Add Tags</span>
              <span className="text-sm text-gray-500">Tag multiple candidates</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center p-6 h-auto"
              onClick={() => setActiveAction('message')}
            >
              <ChatBubbleLeftRightIcon className="w-8 h-8 mb-2 text-gray-600" />
              <span className="font-medium">Bulk Message</span>
              <span className="text-sm text-gray-500">Generate messages</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center p-6 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setActiveAction('delete')}
            >
              <TrashIcon className="w-8 h-8 mb-2" />
              <span className="font-medium">Delete</span>
              <span className="text-sm text-red-500">Remove candidates</span>
            </Button>
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        activeAction 
          ? `${activeAction.charAt(0).toUpperCase() + activeAction.slice(1)} ${selectedCandidateIds.length} Candidates`
          : `Bulk Actions (${selectedCandidateIds.length} selected)`
      }
      size="lg"
      className={className}
    >
      {renderActionContent()}
    </Modal>
  );
};

export default BulkActionsMenu;