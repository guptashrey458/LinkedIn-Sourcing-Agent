import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Loading } from '../ui/Loading';
import { ExportProgress } from '../../types';
import { exportService } from '../../services/exportService';
import { Download, X, AlertCircle, Check, Clock, FileText } from 'lucide-react';

interface ExportProgressTrackerProps {
  className?: string;
}

export const ExportProgressTracker: React.FC<ExportProgressTrackerProps> = ({
  className = ''
}) => {
  const [activeExports, setActiveExports] = useState<ExportProgress[]>([]);

  useEffect(() => {
    // Poll for active exports
    const interval = setInterval(() => {
      // In a real implementation, you'd get this from the export service
      // For now, we'll simulate tracking active exports
      const exports: ExportProgress[] = [];
      setActiveExports(exports);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleDownload = (progress: ExportProgress) => {
    if (progress.downloadUrl) {
      const link = document.createElement('a');
      link.href = progress.downloadUrl;
      link.download = `export_${progress.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCancel = async (exportId: string) => {
    await exportService.cancelExport(exportId);
  };

  const getStatusIcon = (status: ExportProgress['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Loading size="sm" />;
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ExportProgress['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'processing':
        return <Badge variant="info" size="sm">Processing</Badge>;
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'failed':
        return <Badge variant="error" size="sm">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" size="sm">Cancelled</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  if (activeExports.length === 0) {
    return null;
  }

  return (
    <Card className={`${className}`} title="Export Progress">
      <div className="space-y-4">
        {activeExports.map((progress) => (
          <div
            key={progress.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center space-x-3 flex-1">
              {getStatusIcon(progress.status)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    Export {progress.id.split('_')[1]}
                  </span>
                  {getStatusBadge(progress.status)}
                </div>
                
                {progress.status === 'processing' && (
                  <div className="space-y-1">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {progress.processed} of {progress.total} records
                    </div>
                  </div>
                )}
                
                {progress.status === 'failed' && progress.error && (
                  <div className="text-xs text-red-600 truncate">
                    {progress.error}
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  {formatDuration(progress.startTime, progress.endTime)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              {progress.status === 'completed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(progress)}
                  icon={<Download className="w-3 h-3" />}
                >
                  Download
                </Button>
              )}
              
              {progress.status === 'processing' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancel(progress.id)}
                  icon={<X className="w-3 h-3" />}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};