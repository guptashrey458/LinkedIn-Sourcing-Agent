import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { PipelineRun, PipelineFilters } from '../../types';
import { 
  usePipelineHistory, 
  useDeletePipeline, 
  useBulkDeletePipelines,
  useExportPipelineData 
} from '../../hooks/usePipeline';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Select from '../ui/Select';
import DataTable from '../ui/DataTable';
import Loading from '../ui/Loading';
import Modal from '../ui/Modal';
import { format, formatDistanceToNow } from 'date-fns';

interface PipelineHistoryProps {
  jobId?: string;
  className?: string;
}

const PipelineHistory: React.FC<PipelineHistoryProps> = ({
  jobId,
  className = ''
}) => {
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
    status: [] as PipelineRun['status'][],
    jobId: jobId || '',
    dateRange: undefined as [Date, Date] | undefined,
    sortBy: 'startTime' as keyof PipelineRun,
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPipelines, setSelectedPipelines] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineRun | null>(null);
  
  // Fetch pipeline history
  const { 
    data: historyData, 
    isLoading, 
    error,
    refetch 
  } = usePipelineHistory(searchParams);
  
  // Mutations
  const deletePipeline = useDeletePipeline();
  const bulkDeletePipelines = useBulkDeletePipelines();
  const exportData = useExportPipelineData();
  
  // Filter pipelines by search term
  const filteredPipelines = useMemo(() => {
    if (!historyData?.pipelines) return [];
    
    if (!searchTerm) return historyData.pipelines;
    
    return historyData.pipelines.filter(pipeline => 
      pipeline.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pipeline.jobId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [historyData?.pipelines, searchTerm]);
  
  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };
  
  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };
  
  // Handle sorting
  const handleSort = (sortBy: keyof PipelineRun, sortOrder: 'asc' | 'desc') => {
    setSearchParams(prev => ({ ...prev, sortBy, sortOrder }));
  };
  
  // Handle pipeline selection
  const handlePipelineSelect = (pipelineId: string, selected: boolean) => {
    setSelectedPipelines(prev => 
      selected 
        ? [...prev, pipelineId]
        : prev.filter(id => id !== pipelineId)
    );
  };
  
  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    setSelectedPipelines(
      selected ? filteredPipelines.map(p => p.id) : []
    );
  };
  
  // Handle delete pipeline
  const handleDeletePipeline = async (pipelineId: string) => {
    if (confirm('Are you sure you want to delete this pipeline?')) {
      try {
        await deletePipeline.mutateAsync(pipelineId);
        setSelectedPipelines(prev => prev.filter(id => id !== pipelineId));
      } catch (error) {
        console.error('Failed to delete pipeline:', error);
      }
    }
  };
  
  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedPipelines.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedPipelines.length} pipelines?`)) {
      try {
        await bulkDeletePipelines.mutateAsync(selectedPipelines);
        setSelectedPipelines([]);
      } catch (error) {
        console.error('Failed to bulk delete pipelines:', error);
      }
    }
  };
  
  // Handle export
  const handleExport = async (format: 'csv' | 'excel' | 'json') => {
    try {
      await exportData.mutateAsync({
        pipelineIds: selectedPipelines.length > 0 ? selectedPipelines : undefined,
        format,
        includeResults: true,
        includeLogs: false
      });
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };
  
  // Table columns
  const columns = [
    {
      key: 'id',
      header: 'Pipeline ID',
      render: (pipeline: PipelineRun) => (
        <div className="font-mono text-sm">
          {pipeline.id.slice(0, 8)}...
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (pipeline: PipelineRun) => (
        <PipelineStatusBadge status={pipeline.status} />
      )
    },
    {
      key: 'startTime',
      header: 'Started',
      render: (pipeline: PipelineRun) => (
        <div>
          <div className="text-sm font-medium">
            {format(new Date(pipeline.startTime), 'MMM d, yyyy')}
          </div>
          <div className="text-xs text-gray-500">
            {format(new Date(pipeline.startTime), 'HH:mm:ss')}
          </div>
        </div>
      )
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (pipeline: PipelineRun) => (
        <div className="flex items-center text-sm">
          <Clock className="w-4 h-4 mr-1 text-gray-400" />
          {pipeline.duration 
            ? `${Math.round(pipeline.duration / 1000)}s`
            : formatDistanceToNow(new Date(pipeline.startTime))
          }
        </div>
      )
    },
    {
      key: 'candidatesFound',
      header: 'Candidates',
      render: (pipeline: PipelineRun) => (
        <div className="flex items-center text-sm">
          <Users className="w-4 h-4 mr-1 text-gray-400" />
          {pipeline.candidatesFound}
        </div>
      )
    },
    {
      key: 'errors',
      header: 'Errors',
      render: (pipeline: PipelineRun) => (
        <div className="flex items-center text-sm">
          <AlertCircle className="w-4 h-4 mr-1 text-gray-400" />
          {pipeline.errors.length}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (pipeline: PipelineRun) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPipeline(pipeline)}
            icon={<Eye className="w-4 h-4" />}
            title="View Details"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeletePipeline(pipeline.id)}
            icon={<Trash2 className="w-4 h-4" />}
            title="Delete Pipeline"
            className="text-red-600 hover:text-red-700"
          />
        </div>
      )
    }
  ];
  
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loading size="lg" text="Loading pipeline history..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Failed to Load Pipeline History
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <Button onClick={() => refetch()}>
          Try Again
        </Button>
      </Card>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pipeline History
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {historyData?.total || 0} pipelines found
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedPipelines.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={handleBulkDelete}
                icon={<Trash2 className="w-4 h-4" />}
                loading={bulkDeletePipelines.isPending}
              >
                Delete ({selectedPipelines.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                icon={<Download className="w-4 h-4" />}
                loading={exportData.isPending}
              >
                Export
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className="w-4 h-4" />}
          >
            Filters
          </Button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search pipelines by ID or Job ID..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Select
              label="Status"
              value={searchParams.status}
              onChange={(value: any) => handleFilterChange('status', value)}
              multiple
              options={[
                { value: 'running', label: 'Running' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
            />
            
            <Select
              label="Sort By"
              value={searchParams.sortBy}
              onChange={(value: any) => handleFilterChange('sortBy', value)}
              options={[
                { value: 'startTime', label: 'Start Time' },
                { value: 'endTime', label: 'End Time' },
                { value: 'duration', label: 'Duration' },
                { value: 'candidatesFound', label: 'Candidates Found' }
              ]}
            />
            
            <Select
              label="Sort Order"
              value={searchParams.sortOrder}
              onChange={(value: any) => handleFilterChange('sortOrder', value)}
              options={[
                { value: 'desc', label: 'Descending' },
                { value: 'asc', label: 'Ascending' }
              ]}
            />
          </div>
        )}
      </Card>
      
      {/* Pipeline Table */}
      <Card>
        <DataTable
          data={filteredPipelines}
          columns={columns}
          loading={isLoading}
          pagination={{
            page: searchParams.page,
            limit: searchParams.limit,
            total: historyData?.total || 0,
            hasNext: historyData?.hasNext || false,
            hasPrev: historyData?.hasPrev || false,
            onPageChange: handlePageChange
          }}
          selection={{
            selectedItems: selectedPipelines,
            onSelectItem: handlePipelineSelect,
            onSelectAll: handleSelectAll
          }}
          onRowClick={(pipeline: PipelineRun) => setSelectedPipeline(pipeline)}
        />
      </Card>
      
      {/* Pipeline Details Modal */}
      {selectedPipeline && (
        <PipelineDetailsModal
          pipeline={selectedPipeline}
          onClose={() => setSelectedPipeline(null)}
        />
      )}
    </div>
  );
};

interface PipelineStatusBadgeProps {
  status: PipelineRun['status'];
}

const PipelineStatusBadge: React.FC<PipelineStatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: PipelineRun['status']) => {
    switch (status) {
      case 'running':
        return {
          variant: 'info' as const,
          icon: <RefreshCw className="w-3 h-3 animate-spin" />,
          label: 'Running'
        };
      case 'completed':
        return {
          variant: 'success' as const,
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'Completed'
        };
      case 'failed':
        return {
          variant: 'error' as const,
          icon: <XCircle className="w-3 h-3" />,
          label: 'Failed'
        };
      case 'cancelled':
        return {
          variant: 'warning' as const,
          icon: <AlertCircle className="w-3 h-3" />,
          label: 'Cancelled'
        };
      default:
        return {
          variant: 'default' as const,
          icon: <Clock className="w-3 h-3" />,
          label: 'Unknown'
        };
    }
  };
  
  const config = getStatusConfig(status);
  
  return (
    <Badge variant={config.variant} className="flex items-center space-x-1">
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
};

interface PipelineDetailsModalProps {
  pipeline: PipelineRun;
  onClose: () => void;
}

const PipelineDetailsModal: React.FC<PipelineDetailsModalProps> = ({
  pipeline,
  onClose
}) => {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Pipeline ${pipeline.id.slice(0, 8)}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <PipelineStatusBadge status={pipeline.status} />
            <div className="text-sm text-gray-500 mt-1">Status</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {pipeline.candidatesFound}
            </div>
            <div className="text-sm text-gray-500">Candidates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {pipeline.errors.length}
            </div>
            <div className="text-sm text-gray-500">Errors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {pipeline.duration ? `${Math.round(pipeline.duration / 1000)}s` : 'N/A'}
            </div>
            <div className="text-sm text-gray-500">Duration</div>
          </div>
        </div>
        
        {/* Timeline */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Timeline</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Started:</span>
              <span className="font-medium">
                {format(new Date(pipeline.startTime), 'MMM d, yyyy HH:mm:ss')}
              </span>
            </div>
            {pipeline.endTime && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ended:</span>
                <span className="font-medium">
                  {format(new Date(pipeline.endTime), 'MMM d, yyyy HH:mm:ss')}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Stages */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Stages</h3>
          <div className="space-y-3">
            {pipeline.stages.map((stage, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <PipelineStatusBadge status={stage.status as PipelineRun['status']} />
                  <div>
                    <div className="font-medium capitalize">{stage.name}</div>
                    <div className="text-sm text-gray-500">{stage.message}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{Math.round(stage.progress)}%</div>
                  {stage.startTime && stage.endTime && (
                    <div className="text-xs text-gray-500">
                      {Math.round((new Date(stage.endTime).getTime() - new Date(stage.startTime).getTime()) / 1000)}s
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Errors */}
        {pipeline.errors.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
              Errors ({pipeline.errors.length})
            </h3>
            <div className="space-y-2">
              {pipeline.errors.map((error, index) => (
                <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="font-medium text-red-800 dark:text-red-200">
                    {error.stage}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-300 mt-1">
                    {error.message}
                  </div>
                  {error.details && (
                    <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                      {error.details}
                    </div>
                  )}
                  <div className="text-xs text-red-400 dark:text-red-500 mt-1">
                    {format(new Date(error.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PipelineHistory;