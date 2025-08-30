import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Trash2, 
  Download, 
  Edit,
  X,
  AlertTriangle
} from 'lucide-react';
import {
  Button,
  Card,
  Select,
  Badge,
} from '../ui';
import { 
  useBulkUpdateJobs, 
  useBulkDeleteJobs, 
  useExportJobs 
} from '../../hooks/useJobs';
import { JobDescription } from '../../types';

export interface BulkJobActionsProps {
  selectedJobs: string[];
  jobs: JobDescription[];
  onClearSelection: () => void;
  onJobsUpdated?: () => void;
  className?: string;
}

const BulkJobActions: React.FC<BulkJobActionsProps> = ({
  selectedJobs,
  jobs,
  onClearSelection,
  onJobsUpdated,
  className,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    action: string;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  
  const bulkUpdateMutation = useBulkUpdateJobs();
  const bulkDeleteMutation = useBulkDeleteJobs();
  const exportJobsMutation = useExportJobs();
  
  const selectedJobsData = jobs.filter(job => selectedJobs.includes(job.id));
  
  // Handle bulk status update
  const handleBulkStatusUpdate = async (status: JobDescription['status']) => {
    try {
      await bulkUpdateMutation.mutateAsync({
        jobIds: selectedJobs,
        updates: { status },
      });
      onClearSelection();
      onJobsUpdated?.();
    } catch (error) {
      console.error('Failed to update jobs:', error);
    }
  };
  
  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      await bulkDeleteMutation.mutateAsync(selectedJobs);
      onClearSelection();
      onJobsUpdated?.();
    } catch (error) {
      console.error('Failed to delete jobs:', error);
    }
  };
  
  // Handle export
  const handleExport = async (format: 'csv' | 'excel' | 'json') => {
    try {
      await exportJobsMutation.mutateAsync({
        jobIds: selectedJobs,
        format,
        fields: ['title', 'company', 'location', 'status', 'skills', 'requirements', 'salaryRange', 'createdAt'],
      });
    } catch (error) {
      console.error('Failed to export jobs:', error);
    }
  };
  
  // Confirm dialog actions
  const confirmActions = {
    activate: {
      title: 'Activate Jobs',
      message: `Are you sure you want to activate ${selectedJobs.length} job(s)?`,
      onConfirm: () => handleBulkStatusUpdate('active'),
    },
    pause: {
      title: 'Pause Jobs',
      message: `Are you sure you want to pause ${selectedJobs.length} job(s)?`,
      onConfirm: () => handleBulkStatusUpdate('paused'),
    },
    complete: {
      title: 'Complete Jobs',
      message: `Are you sure you want to mark ${selectedJobs.length} job(s) as completed?`,
      onConfirm: () => handleBulkStatusUpdate('completed'),
    },
    draft: {
      title: 'Move to Draft',
      message: `Are you sure you want to move ${selectedJobs.length} job(s) to draft status?`,
      onConfirm: () => handleBulkStatusUpdate('draft'),
    },
    delete: {
      title: 'Delete Jobs',
      message: `Are you sure you want to permanently delete ${selectedJobs.length} job(s)? This action cannot be undone.`,
      onConfirm: handleBulkDelete,
    },
  };
  
  const showConfirm = (action: keyof typeof confirmActions) => {
    setShowConfirmDialog({
      action,
      ...confirmActions[action],
    });
  };
  
  const exportOptions = [
    { value: 'csv', label: 'Export as CSV' },
    { value: 'excel', label: 'Export as Excel' },
    { value: 'json', label: 'Export as JSON' },
  ];
  
  if (selectedJobs.length === 0) {
    return null;
  }
  
  return (
    <>
      <Card className={className}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                  icon={<X className="h-4 w-4" />}
                />
              </div>
              
              {/* Status breakdown */}
              <div className="flex items-center gap-2">
                {Object.entries(
                  selectedJobsData.reduce((acc, job) => {
                    acc[job.status] = (acc[job.status] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([status, count]) => (
                  <Badge key={status} variant="secondary" size="sm">
                    {status}: {count}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Status Actions */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => showConfirm('activate')}
                icon={<Play className="h-4 w-4" />}
                disabled={bulkUpdateMutation.isPending}
              >
                Activate
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => showConfirm('pause')}
                icon={<Pause className="h-4 w-4" />}
                disabled={bulkUpdateMutation.isPending}
              >
                Pause
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => showConfirm('complete')}
                icon={<CheckCircle className="h-4 w-4" />}
                disabled={bulkUpdateMutation.isPending}
              >
                Complete
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => showConfirm('draft')}
                icon={<Edit className="h-4 w-4" />}
                disabled={bulkUpdateMutation.isPending}
              >
                Draft
              </Button>
              
              {/* Export */}
              <Select
                options={[
                  { value: '', label: 'Export...' },
                  ...exportOptions,
                ]}
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleExport(e.target.value as 'csv' | 'excel' | 'json');
                  }
                }}
                className="w-32"
                disabled={exportJobsMutation.isPending}
              />
              
              {/* Delete */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => showConfirm('delete')}
                icon={<Trash2 className="h-4 w-4" />}
                disabled={bulkDeleteMutation.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {showConfirmDialog.title}
                  </h3>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                {showConfirmDialog.message}
              </p>
              
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant={showConfirmDialog.action === 'delete' ? 'danger' : 'primary'}
                  onClick={() => {
                    showConfirmDialog.onConfirm();
                    setShowConfirmDialog(null);
                  }}
                  loading={bulkUpdateMutation.isPending || bulkDeleteMutation.isPending}
                >
                  {showConfirmDialog.action === 'delete' ? 'Delete' : 'Confirm'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default BulkJobActions;