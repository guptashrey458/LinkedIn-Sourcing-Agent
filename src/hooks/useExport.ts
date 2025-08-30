import { useState, useCallback } from 'react';
import { ExportField, Candidate, JobDescription, PipelineRun, Message } from '../types';
import { exportService } from '../services/exportService';

// Define available fields for each export type
export const CANDIDATE_EXPORT_FIELDS: ExportField[] = [
  { key: 'id', label: 'ID', type: 'string', selected: true },
  { key: 'name', label: 'Name', type: 'string', selected: true },
  { key: 'email', label: 'Email', type: 'string', selected: true },
  { key: 'linkedinUrl', label: 'LinkedIn URL', type: 'string', selected: true },
  { key: 'title', label: 'Title', type: 'string', selected: true },
  { key: 'company', label: 'Company', type: 'string', selected: true },
  { key: 'location', label: 'Location', type: 'string', selected: true },
  { key: 'skills', label: 'Skills', type: 'array', selected: true },
  { key: 'experience', label: 'Experience (Years)', type: 'number', selected: true },
  { key: 'score', label: 'Overall Score', type: 'number', selected: true },
  { key: 'scoreBreakdown.skillsMatch', label: 'Skills Match Score', type: 'number', selected: false },
  { key: 'scoreBreakdown.experienceMatch', label: 'Experience Match Score', type: 'number', selected: false },
  { key: 'scoreBreakdown.locationMatch', label: 'Location Match Score', type: 'number', selected: false },
  { key: 'scoreBreakdown.overallFit', label: 'Overall Fit Score', type: 'number', selected: false },
  { key: 'summary', label: 'Summary', type: 'string', selected: false },
  { key: 'status', label: 'Status', type: 'string', selected: true },
  { key: 'tags', label: 'Tags', type: 'array', selected: false },
  { key: 'createdAt', label: 'Created Date', type: 'date', selected: false },
  { key: 'updatedAt', label: 'Updated Date', type: 'date', selected: false }
];

export const JOB_EXPORT_FIELDS: ExportField[] = [
  { key: 'id', label: 'ID', type: 'string', selected: true },
  { key: 'title', label: 'Job Title', type: 'string', selected: true },
  { key: 'company', label: 'Company', type: 'string', selected: true },
  { key: 'description', label: 'Description', type: 'string', selected: false },
  { key: 'requirements', label: 'Requirements', type: 'array', selected: true },
  { key: 'location', label: 'Location', type: 'string', selected: true },
  { key: 'skills', label: 'Required Skills', type: 'array', selected: true },
  { key: 'remote', label: 'Remote Work', type: 'boolean', selected: true },
  { key: 'salaryRange', label: 'Salary Range', type: 'string', selected: true },
  { key: 'status', label: 'Status', type: 'string', selected: true },
  { key: 'createdAt', label: 'Created Date', type: 'date', selected: false },
  { key: 'updatedAt', label: 'Updated Date', type: 'date', selected: false }
];

export const PIPELINE_EXPORT_FIELDS: ExportField[] = [
  { key: 'id', label: 'Pipeline ID', type: 'string', selected: true },
  { key: 'jobId', label: 'Job ID', type: 'string', selected: true },
  { key: 'status', label: 'Status', type: 'string', selected: true },
  { key: 'currentStage.name', label: 'Current Stage', type: 'string', selected: true },
  { key: 'candidatesFound', label: 'Candidates Found', type: 'number', selected: true },
  { key: 'startTime', label: 'Start Time', type: 'date', selected: true },
  { key: 'endTime', label: 'End Time', type: 'date', selected: true },
  { key: 'duration', label: 'Duration (ms)', type: 'number', selected: false },
  { key: 'errors', label: 'Errors', type: 'array', selected: false }
];

export const MESSAGE_EXPORT_FIELDS: ExportField[] = [
  { key: 'id', label: 'Message ID', type: 'string', selected: true },
  { key: 'candidateId', label: 'Candidate ID', type: 'string', selected: true },
  { key: 'jobId', label: 'Job ID', type: 'string', selected: false },
  { key: 'subject', label: 'Subject', type: 'string', selected: true },
  { key: 'content', label: 'Content', type: 'string', selected: false },
  { key: 'status', label: 'Status', type: 'string', selected: true },
  { key: 'sentAt', label: 'Sent Date', type: 'date', selected: true },
  { key: 'deliveredAt', label: 'Delivered Date', type: 'date', selected: false },
  { key: 'openedAt', label: 'Opened Date', type: 'date', selected: false },
  { key: 'repliedAt', label: 'Replied Date', type: 'date', selected: false },
  { key: 'createdAt', label: 'Created Date', type: 'date', selected: false },
  { key: 'createdBy', label: 'Created By', type: 'string', selected: false }
];

interface UseExportOptions {
  onExportComplete?: (downloadUrl: string) => void;
  onExportError?: (error: string) => void;
}

export const useExport = (options: UseExportOptions = {}) => {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<'candidates' | 'jobs' | 'pipelines' | 'messages'>('candidates');
  const [exportFilters, setExportFilters] = useState<Record<string, any>>({});

  const getExportFields = useCallback((type: string): ExportField[] => {
    switch (type) {
      case 'candidates':
        return CANDIDATE_EXPORT_FIELDS;
      case 'jobs':
        return JOB_EXPORT_FIELDS;
      case 'pipelines':
        return PIPELINE_EXPORT_FIELDS;
      case 'messages':
        return MESSAGE_EXPORT_FIELDS;
      default:
        return [];
    }
  }, []);

  const openExportDialog = useCallback((
    type: 'candidates' | 'jobs' | 'pipelines' | 'messages',
    filters: Record<string, any> = {}
  ) => {
    setExportType(type);
    setExportFilters(filters);
    setIsExportDialogOpen(true);
  }, []);

  const closeExportDialog = useCallback(() => {
    setIsExportDialogOpen(false);
  }, []);

  const handleExportComplete = useCallback((downloadUrl: string) => {
    options.onExportComplete?.(downloadUrl);
  }, [options]);

  const quickExport = useCallback(async (
    type: 'candidates' | 'jobs' | 'pipelines' | 'messages',
    format: 'csv' | 'excel' | 'json' = 'csv',
    filters: Record<string, any> = {}
  ) => {
    try {
      const fields = getExportFields(type);
      const selectedFields = fields.filter(field => field.selected);
      
      const exportId = await exportService.startExport({
        type,
        config: {
          format,
          fields: selectedFields,
          includeHeaders: true,
          filename: `${type}_export_${new Date().toISOString().split('T')[0]}`
        },
        filters
      });

      // Poll for completion
      const pollProgress = () => {
        const progress = exportService.getExportProgress(exportId);
        if (progress) {
          if (progress.status === 'completed' && progress.downloadUrl) {
            handleExportComplete(progress.downloadUrl);
          } else if (progress.status === 'failed') {
            options.onExportError?.(progress.error || 'Export failed');
          } else if (progress.status === 'processing') {
            setTimeout(pollProgress, 1000);
          }
        }
      };

      setTimeout(pollProgress, 1000);
      
      return exportId;
    } catch (error) {
      options.onExportError?.(error instanceof Error ? error.message : 'Export failed');
      throw error;
    }
  }, [getExportFields, handleExportComplete, options]);

  return {
    isExportDialogOpen,
    exportType,
    exportFilters,
    openExportDialog,
    closeExportDialog,
    handleExportComplete,
    quickExport,
    getExportFields
  };
};