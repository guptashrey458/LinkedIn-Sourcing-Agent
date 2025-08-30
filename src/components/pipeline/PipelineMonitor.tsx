import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react';
import { PipelineRun, PipelineStage } from '../../types';
import { 
  useActivePipelines, 
  usePipelineStatus, 
  useStopPipeline, 
  usePausePipeline, 
  useResumePipeline,
  useRetryPipelineStage 
} from '../../hooks/usePipeline';
import { useRealTimePipelineMonitoring } from '../../hooks/useRealTimePipeline';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Loading from '../ui/Loading';
import { formatDistanceToNow, format } from 'date-fns';

interface PipelineMonitorProps {
  jobId?: string;
  onStageComplete?: (stage: PipelineStage) => void;
  onError?: (error: any) => void;
  realTime?: boolean;
  className?: string;
}

const PipelineMonitor: React.FC<PipelineMonitorProps> = ({
  jobId,
  onStageComplete,
  onError,
  realTime = true,
  className = ''
}) => {
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  
  // Fetch active pipelines
  const { 
    data: activePipelines = [], 
    isLoading: loadingPipelines,
    error: pipelinesError 
  } = useActivePipelines(realTime ? 5000 : undefined);
  
  // Filter pipelines by jobId if provided
  const filteredPipelines = jobId 
    ? activePipelines.filter(pipeline => pipeline.jobId === jobId)
    : activePipelines;
  
  // Set up real-time monitoring for filtered pipelines
  const pipelineIds = filteredPipelines.map(p => p.id);
  const { 
    connected: realTimeConnected,
    error: realTimeError 
  } = useRealTimePipelineMonitoring(pipelineIds, {
    enabled: realTime,
    showNotifications: true,
    debug: false
  });
  
  // Mutations
  const stopPipeline = useStopPipeline();
  const pausePipeline = usePausePipeline();
  const resumePipeline = useResumePipeline();
  const retryStage = useRetryPipelineStage();
  
  // Handle pipeline actions
  const handleStopPipeline = async (pipelineId: string) => {
    try {
      await stopPipeline.mutateAsync(pipelineId);
    } catch (error) {
      onError?.(error);
    }
  };
  
  const handlePausePipeline = async (pipelineId: string) => {
    try {
      await pausePipeline.mutateAsync(pipelineId);
    } catch (error) {
      onError?.(error);
    }
  };
  
  const handleResumePipeline = async (pipelineId: string) => {
    try {
      await resumePipeline.mutateAsync(pipelineId);
    } catch (error) {
      onError?.(error);
    }
  };
  
  const handleRetryStage = async (pipelineId: string, stageName: string) => {
    try {
      await retryStage.mutateAsync({ pipelineId, stageName });
    } catch (error) {
      onError?.(error);
    }
  };
  
  // Handle stage completion callback
  useEffect(() => {
    if (onStageComplete && filteredPipelines.length > 0) {
      filteredPipelines.forEach(pipeline => {
        const completedStages = pipeline.stages.filter(stage => stage.status === 'completed');
        completedStages.forEach(stage => {
          onStageComplete(stage);
        });
      });
    }
  }, [filteredPipelines, onStageComplete]);
  
  // Handle errors
  useEffect(() => {
    if (pipelinesError && onError) {
      onError(pipelinesError);
    }
  }, [pipelinesError, onError]);
  
  if (loadingPipelines) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loading size="lg" text="Loading pipelines..." />
      </div>
    );
  }
  
  if (filteredPipelines.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <div className="text-gray-500 dark:text-gray-400">
          <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Active Pipelines</h3>
          <p className="text-sm">
            {jobId 
              ? 'No pipelines are currently running for this job.'
              : 'No pipelines are currently running.'
            }
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {filteredPipelines.map(pipeline => (
        <PipelineCard
          key={pipeline.id}
          pipeline={pipeline}
          isSelected={selectedPipeline === pipeline.id}
          onSelect={() => setSelectedPipeline(
            selectedPipeline === pipeline.id ? null : pipeline.id
          )}
          onStop={() => handleStopPipeline(pipeline.id)}
          onPause={() => handlePausePipeline(pipeline.id)}
          onResume={() => handleResumePipeline(pipeline.id)}
          onRetryStage={(stageName) => handleRetryStage(pipeline.id, stageName)}
          realTime={realTime}
        />
      ))}
    </div>
  );
};

interface PipelineCardProps {
  pipeline: PipelineRun;
  isSelected: boolean;
  onSelect: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onRetryStage: (stageName: string) => void;
  realTime: boolean;
}

const PipelineCard: React.FC<PipelineCardProps> = ({
  pipeline,
  isSelected,
  onSelect,
  onStop,
  onPause,
  onResume,
  onRetryStage,
  realTime
}) => {
  // Get real-time status if enabled
  const { data: liveStatus } = usePipelineStatus(
    pipeline.id, 
    realTime && pipeline.status === 'running',
    2000
  );
  
  // Use live status if available, otherwise use pipeline data
  const currentStatus = liveStatus || {
    status: pipeline.status,
    currentStage: pipeline.currentStage,
    progress: pipeline.currentStage.progress,
    candidatesFound: pipeline.candidatesFound,
    errors: pipeline.errors
  };
  
  const getStatusColor = (status: PipelineRun['status']) => {
    switch (status) {
      case 'running': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'warning';
      default: return 'default';
    }
  };
  
  const getStatusIcon = (status: PipelineRun['status']) => {
    switch (status) {
      case 'running': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };
  
  const canPause = currentStatus.status === 'running';
  const canResume = currentStatus.status === 'cancelled';
  const canStop = currentStatus.status === 'running';
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Badge variant={getStatusColor(currentStatus.status)} className="flex items-center space-x-1">
              {getStatusIcon(currentStatus.status)}
              <span className="capitalize">{currentStatus.status}</span>
            </Badge>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Pipeline {pipeline.id.slice(0, 8)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Started {formatDistanceToNow(new Date(pipeline.startTime))} ago
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Pipeline Actions */}
            {canPause && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
                icon={<Pause className="w-4 h-4" />}
                title="Pause Pipeline"
              />
            )}
            {canResume && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResume}
                icon={<Play className="w-4 h-4" />}
                title="Resume Pipeline"
              />
            )}
            {canStop && (
              <Button
                variant="outline"
                size="sm"
                onClick={onStop}
                icon={<Square className="w-4 h-4" />}
                title="Stop Pipeline"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelect}
              icon={<MoreHorizontal className="w-4 h-4" />}
              title={isSelected ? "Collapse Details" : "Expand Details"}
            />
          </div>
        </div>
        
        {/* Progress Overview */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(currentStatus.progress)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center">
              <Users className="w-5 h-5 mr-1" />
              {currentStatus.candidatesFound}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Candidates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentStatus.errors.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Errors</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Overall Progress</span>
            <span>{Math.round(currentStatus.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentStatus.progress}%` }}
            />
          </div>
        </div>
        
        {/* Current Stage */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Current Stage:</span>
          <Badge variant="outline" className="capitalize">
            {currentStatus.currentStage.name}
          </Badge>
        </div>
      </div>
      
      {/* Expanded Details */}
      {isSelected && (
        <PipelineDetails 
          pipeline={pipeline}
          liveStatus={currentStatus}
          onRetryStage={onRetryStage}
        />
      )}
    </Card>
  );
};

interface PipelineDetailsProps {
  pipeline: PipelineRun;
  liveStatus: any;
  onRetryStage: (stageName: string) => void;
}

const PipelineDetails: React.FC<PipelineDetailsProps> = ({
  pipeline,
  liveStatus,
  onRetryStage
}) => {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="p-4">
        {/* Stage Progress */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Stage Progress</h4>
          <div className="space-y-3">
            {pipeline.stages.map((stage, index) => (
              <PipelineStageItem
                key={`${stage.name}-${index}`}
                stage={stage}
                onRetry={() => onRetryStage(stage.name)}
              />
            ))}
          </div>
        </div>
        
        {/* Errors */}
        {liveStatus.errors.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
              Errors ({liveStatus.errors.length})
            </h4>
            <div className="space-y-2">
              {liveStatus.errors.map((error: any, index: number) => (
                <div 
                  key={index}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
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
                    </div>
                    {error.recoverable && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetryStage(error.stage)}
                        className="ml-2"
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Started:</span>
            <div className="font-medium text-gray-900 dark:text-white">
              {format(new Date(pipeline.startTime), 'MMM d, yyyy HH:mm:ss')}
            </div>
          </div>
          {pipeline.endTime && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Ended:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {format(new Date(pipeline.endTime), 'MMM d, yyyy HH:mm:ss')}
              </div>
            </div>
          )}
          {pipeline.duration && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Duration:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {Math.round(pipeline.duration / 1000)}s
              </div>
            </div>
          )}
          <div>
            <span className="text-gray-500 dark:text-gray-400">Job ID:</span>
            <div className="font-medium text-gray-900 dark:text-white font-mono text-xs">
              {pipeline.jobId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PipelineStageItemProps {
  stage: PipelineStage;
  onRetry: () => void;
}

const PipelineStageItem: React.FC<PipelineStageItemProps> = ({ stage, onRetry }) => {
  const getStageIcon = (status: PipelineStage['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-gray-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getStageColor = (status: PipelineStage['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-gray-300 dark:bg-gray-600';
      default: return 'bg-gray-300 dark:bg-gray-600';
    }
  };
  
  return (
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0">
        {getStageIcon(stage.status)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white capitalize">
              {stage.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {stage.message}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(stage.progress)}%
            </span>
            {stage.status === 'failed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="text-xs"
              >
                Retry
              </Button>
            )}
          </div>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${getStageColor(stage.status)}`}
              style={{ width: `${stage.progress}%` }}
            />
          </div>
        </div>
        {stage.startTime && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {stage.endTime 
              ? `Completed in ${Math.round((new Date(stage.endTime).getTime() - new Date(stage.startTime).getTime()) / 1000)}s`
              : `Started ${formatDistanceToNow(new Date(stage.startTime))} ago`
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineMonitor;