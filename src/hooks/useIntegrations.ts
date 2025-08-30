import { useState, useEffect, useCallback } from 'react';
import { IntegrationConfig, IntegrationLog, Candidate, JobDescription, PipelineRun } from '../types';
import { integrationService } from '../services/integrationService';

interface UseIntegrationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useIntegrations = (options: UseIntegrationsOptions = {}) => {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await integrationService.getIntegrations();
      setIntegrations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadIntegrations, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadIntegrations]);

  const createIntegration = useCallback(async (config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newIntegration = await integrationService.createIntegration(config);
      setIntegrations(prev => [...prev, newIntegration]);
      return newIntegration;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateIntegration = useCallback(async (integrationId: string, updates: Partial<IntegrationConfig>) => {
    try {
      const updatedIntegration = await integrationService.updateIntegration(integrationId, updates);
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === integrationId ? updatedIntegration : integration
        )
      );
      return updatedIntegration;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteIntegration = useCallback(async (integrationId: string) => {
    try {
      await integrationService.deleteIntegration(integrationId);
      setIntegrations(prev => prev.filter(integration => integration.id !== integrationId));
    } catch (err) {
      throw err;
    }
  }, []);

  const testIntegration = useCallback(async (integrationId: string) => {
    try {
      return await integrationService.testIntegration(integrationId);
    } catch (err) {
      throw err;
    }
  }, []);

  const enableIntegration = useCallback(async (integrationId: string) => {
    return updateIntegration(integrationId, { enabled: true });
  }, [updateIntegration]);

  const disableIntegration = useCallback(async (integrationId: string) => {
    return updateIntegration(integrationId, { enabled: false });
  }, [updateIntegration]);

  return {
    integrations,
    loading,
    error,
    loadIntegrations,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
    enableIntegration,
    disableIntegration
  };
};

export const useIntegrationLogs = (integrationId: string) => {
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await integrationService.getIntegrationLogs(integrationId);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [integrationId]);

  const clearLogs = useCallback(async () => {
    try {
      await integrationService.clearIntegrationLogs(integrationId);
      setLogs([]);
    } catch (err) {
      throw err;
    }
  }, [integrationId]);

  useEffect(() => {
    if (integrationId) {
      loadLogs();
    }
  }, [integrationId, loadLogs]);

  return {
    logs,
    loading,
    error,
    loadLogs,
    clearLogs
  };
};

export const useIntegrationSync = () => {
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  const syncCandidates = useCallback(async (integrationId: string, candidateIds?: string[]) => {
    try {
      setSyncing(prev => ({ ...prev, [integrationId]: true }));
      return await integrationService.syncCandidates(integrationId, candidateIds);
    } catch (err) {
      throw err;
    } finally {
      setSyncing(prev => ({ ...prev, [integrationId]: false }));
    }
  }, []);

  const syncJobs = useCallback(async (integrationId: string, jobIds?: string[]) => {
    try {
      setSyncing(prev => ({ ...prev, [integrationId]: true }));
      return await integrationService.syncJobs(integrationId, jobIds);
    } catch (err) {
      throw err;
    } finally {
      setSyncing(prev => ({ ...prev, [integrationId]: false }));
    }
  }, []);

  const syncPipelines = useCallback(async (integrationId: string, pipelineIds?: string[]) => {
    try {
      setSyncing(prev => ({ ...prev, [integrationId]: true }));
      return await integrationService.syncPipelines(integrationId, pipelineIds);
    } catch (err) {
      throw err;
    } finally {
      setSyncing(prev => ({ ...prev, [integrationId]: false }));
    }
  }, []);

  const bulkSync = useCallback(async (integrationId: string, data: { 
    candidates?: string[]; 
    jobs?: string[]; 
    pipelines?: string[] 
  }) => {
    try {
      setSyncing(prev => ({ ...prev, [integrationId]: true }));
      return await integrationService.bulkSync(integrationId, data);
    } catch (err) {
      throw err;
    } finally {
      setSyncing(prev => ({ ...prev, [integrationId]: false }));
    }
  }, []);

  const pushCandidate = useCallback(async (integrationId: string, candidate: Candidate) => {
    try {
      return await integrationService.pushCandidate(integrationId, candidate);
    } catch (err) {
      throw err;
    }
  }, []);

  const pushJob = useCallback(async (integrationId: string, job: JobDescription) => {
    try {
      return await integrationService.pushJob(integrationId, job);
    } catch (err) {
      throw err;
    }
  }, []);

  const pushPipelineUpdate = useCallback(async (integrationId: string, pipeline: PipelineRun) => {
    try {
      return await integrationService.pushPipelineUpdate(integrationId, pipeline);
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    syncing,
    syncCandidates,
    syncJobs,
    syncPipelines,
    bulkSync,
    pushCandidate,
    pushJob,
    pushPipelineUpdate
  };
};