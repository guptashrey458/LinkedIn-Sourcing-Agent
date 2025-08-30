import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import { Loading } from '../ui/Loading';
import { ExportConfig, ExportField, ExportProgress } from '../../types';
import { exportService } from '../../services/exportService';
import { Download, FileText, Table, Code, X, Check, AlertCircle } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'candidates' | 'jobs' | 'pipelines' | 'messages';
  title: string;
  availableFields: ExportField[];
  filters?: Record<string, any>;
  onExportComplete?: (downloadUrl: string) => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  type,
  title,
  availableFields,
  filters,
  onExportComplete
}) => {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'csv',
    fields: availableFields.map(field => ({ ...field, selected: true })),
    includeHeaders: true,
    filename: `${type}_export_${new Date().toISOString().split('T')[0]}`
  });

  const [exportId, setExportId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setConfig({
        format: 'csv',
        fields: availableFields.map(field => ({ ...field, selected: true })),
        includeHeaders: true,
        filename: `${type}_export_${new Date().toISOString().split('T')[0]}`
      });
      setExportId(null);
      setProgress(null);
      setIsExporting(false);
    }
  }, [isOpen, type, availableFields]);

  // Poll for export progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (exportId && isExporting) {
      interval = setInterval(() => {
        const currentProgress = exportService.getExportProgress(exportId);
        if (currentProgress) {
          setProgress(currentProgress);
          
          if (currentProgress.status === 'completed') {
            setIsExporting(false);
            if (currentProgress.downloadUrl && onExportComplete) {
              onExportComplete(currentProgress.downloadUrl);
            }
          } else if (currentProgress.status === 'failed' || currentProgress.status === 'cancelled') {
            setIsExporting(false);
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [exportId, isExporting, onExportComplete]);

  const handleFormatChange = (format: 'csv' | 'excel' | 'json') => {
    setConfig(prev => ({ ...prev, format }));
  };

  const handleFieldToggle = (fieldKey: string) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.key === fieldKey ? { ...field, selected: !field.selected } : field
      )
    }));
  };

  const handleSelectAll = () => {
    const allSelected = config.fields.every(field => field.selected);
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(field => ({ ...field, selected: !allSelected }))
    }));
  };

  const handleFilenameChange = (filename: string) => {
    setConfig(prev => ({ ...prev, filename }));
  };

  const handleIncludeHeadersChange = (includeHeaders: boolean) => {
    setConfig(prev => ({ ...prev, includeHeaders }));
  };

  const handleStartExport = async () => {
    try {
      setIsExporting(true);
      const id = await exportService.startExport({
        type,
        config: { ...config, filters },
        filters
      });
      setExportId(id);
    } catch (error) {
      console.error('Failed to start export:', error);
      setIsExporting(false);
    }
  };

  const handleCancelExport = async () => {
    if (exportId) {
      await exportService.cancelExport(exportId);
      setIsExporting(false);
      setProgress(null);
    }
  };

  const handleDownload = () => {
    if (progress?.downloadUrl) {
      const link = document.createElement('a');
      link.href = progress.downloadUrl;
      link.download = config.filename || 'export';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return <Table className="w-4 h-4" />;
      case 'excel':
        return <FileText className="w-4 h-4" />;
      case 'json':
        return <Code className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const selectedFieldsCount = config.fields.filter(field => field.selected).length;
  const canExport = selectedFieldsCount > 0 && config.filename.trim() !== '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Export {title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!isExporting && !progress ? (
          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['csv', 'excel', 'json'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => handleFormatChange(format)}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                      config.format === format
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {getFormatIcon(format)}
                    <span className="text-sm font-medium uppercase">{format}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filename */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filename
              </label>
              <Input
                value={config.filename}
                onChange={(e) => handleFilenameChange(e.target.value)}
                placeholder="Enter filename"
              />
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Options
              </label>
              <div className="space-y-2">
                <Checkbox
                  checked={config.includeHeaders}
                  onChange={handleIncludeHeadersChange}
                  label="Include column headers"
                />
              </div>
            </div>

            {/* Field Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Fields to Export
                </label>
                <div className="flex items-center space-x-3">
                  <Badge variant="info" size="sm">
                    {selectedFieldsCount} of {config.fields.length} selected
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {config.fields.every(field => field.selected) ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <div className="p-3 space-y-2">
                  {config.fields.map((field) => (
                    <Checkbox
                      key={field.key}
                      checked={field.selected}
                      onChange={() => handleFieldToggle(field.key)}
                      label={field.label}
                      description={field.key}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleStartExport}
                disabled={!canExport}
                icon={<Download className="w-4 h-4" />}
              >
                Start Export
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Display */}
            <div className="text-center">
              {progress?.status === 'processing' && (
                <div className="space-y-4">
                  <Loading size="lg" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Exporting {title}...
                    </h3>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {progress.processed} of {progress.total} records processed
                    </p>
                  </div>
                </div>
              )}

              {progress?.status === 'completed' && (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Export Completed!
                    </h3>
                    <p className="text-sm text-gray-600">
                      Successfully exported {progress.processed} records
                    </p>
                  </div>
                </div>
              )}

              {progress?.status === 'failed' && (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Export Failed
                    </h3>
                    <p className="text-sm text-red-600">
                      {progress.error || 'An error occurred during export'}
                    </p>
                  </div>
                </div>
              )}

              {progress?.status === 'cancelled' && (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <X className="w-8 h-8 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Export Cancelled
                    </h3>
                    <p className="text-sm text-gray-600">
                      The export operation was cancelled
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-3 pt-4 border-t">
              {progress?.status === 'processing' && (
                <Button variant="outline" onClick={handleCancelExport}>
                  Cancel Export
                </Button>
              )}
              
              {progress?.status === 'completed' && (
                <>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button
                    onClick={handleDownload}
                    icon={<Download className="w-4 h-4" />}
                  >
                    Download File
                  </Button>
                </>
              )}
              
              {(progress?.status === 'failed' || progress?.status === 'cancelled') && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};