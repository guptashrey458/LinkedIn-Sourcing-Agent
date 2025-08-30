import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Loading } from '../ui/Loading';
import { Card } from '../ui/Card';
import { IntegrationConfig, IntegrationLog } from '../../types';
import { integrationService } from '../../services/integrationService';
import { 
  X, 
  RefreshCw, 
  Trash2, 
  AlertCircle, 
  Check, 
  Clock,
  ChevronDown,
  ChevronRight,
  Download
} from 'lucide-react';

interface IntegrationLogsProps {
  isOpen: boolean;
  onClose: () => void;
  integration: IntegrationConfig;
}

export const IntegrationLogs: React.FC<IntegrationLogsProps> = ({
  isOpen,
  onClose,
  integration
}) => {
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'warning'>('all');

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen, integration.id]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await integrationService.getIntegrationLogs(integration.id);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load integration logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs for this integration?')) return;

    try {
      setLoading(true);
      await integrationService.clearIntegrationLogs(integration.id);
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportLogs = () => {
    const filteredLogs = getFilteredLogs();
    const csvContent = [
      'Timestamp,Type,Status,Message,Details',
      ...filteredLogs.map(log => [
        log.timestamp.toISOString(),
        log.type,
        log.status,
        `"${log.message.replace(/"/g, '""')}"`,
        log.details ? `"${JSON.stringify(log.details).replace(/"/g, '""')}"` : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `integration_logs_${integration.name}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getFilteredLogs = () => {
    if (filter === 'all') return logs;
    return logs.filter(log => log.status === filter);
  };

  const getStatusIcon = (status: IntegrationLog['status']) => {
    switch (status) {
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: IntegrationLog['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="success" size="sm">Success</Badge>;
      case 'error':
        return <Badge variant="error" size="sm">Error</Badge>;
      case 'warning':
        return <Badge variant="warning" size="sm">Warning</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`;
    } else {
      return `${(duration / 60000).toFixed(1)}m`;
    }
  };

  const filteredLogs = getFilteredLogs();
  const logCounts = {
    all: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    error: logs.filter(l => l.status === 'error').length,
    warning: logs.filter(l => l.status === 'warning').length
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Integration Logs: {integration.name}
            </h2>
            <p className="text-sm text-gray-600">
              View activity logs and troubleshoot integration issues
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {/* Filter Buttons */}
            {(['all', 'success', 'error', 'warning'] as const).map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterType)}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                {logCounts[filterType] > 0 && (
                  <span className="ml-1 text-xs">({logCounts[filterType]})</span>
                )}
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportLogs}
              icon={<Download className="w-4 h-4" />}
              disabled={filteredLogs.length === 0}
            >
              Export
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              loading={loading}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearLogs}
              icon={<Trash2 className="w-4 h-4" />}
              disabled={logs.length === 0}
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loading size="md" text="Loading logs..." />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {filter === 'all' ? 'No logs found' : `No ${filter} logs found`}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 pt-1">
                      {getStatusIcon(log.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatusBadge(log.status)}
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {log.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.timestamp.toLocaleString()}
                        </span>
                        {log.duration && (
                          <span className="text-xs text-gray-500">
                            ({formatDuration(log.duration)})
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">
                        {log.message}
                      </p>
                      
                      {log.details && (
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLogExpansion(log.id)}
                            icon={expandedLogs.has(log.id) ? 
                              <ChevronDown className="w-3 h-3" /> : 
                              <ChevronRight className="w-3 h-3" />
                            }
                          >
                            {expandedLogs.has(log.id) ? 'Hide' : 'Show'} Details
                          </Button>
                          
                          {expandedLogs.has(log.id) && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md">
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};