import { 
  IntegrationConfig, 
  WebhookConfig, 
  ApiIntegrationConfig, 
  IntegrationLog,
  Candidate,
  JobDescription,
  PipelineRun,
  Message
} from '../types';
import { apiClient } from './api';

class IntegrationService {
  private webhookListeners = new Map<string, (data: any) => void>();
  private retryQueues = new Map<string, any[]>();

  // Integration Configuration Management
  async getIntegrations(): Promise<IntegrationConfig[]> {
    const response = await apiClient.get('/integrations');
    return response.data.data;
  }

  async getIntegration(integrationId: string): Promise<IntegrationConfig> {
    const response = await apiClient.get(`/integrations/${integrationId}`);
    return response.data.data;
  }

  async createIntegration(config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConfig> {
    const response = await apiClient.post('/integrations', config);
    return response.data.data;
  }

  async updateIntegration(integrationId: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig> {
    const response = await apiClient.put(`/integrations/${integrationId}`, updates);
    return response.data.data;
  }

  async deleteIntegration(integrationId: string): Promise<void> {
    await apiClient.delete(`/integrations/${integrationId}`);
  }

  async testIntegration(integrationId: string): Promise<{ success: boolean; message: string; details?: any }> {
    const response = await apiClient.post(`/integrations/${integrationId}/test`);
    return response.data;
  }

  // Webhook Management
  async createWebhook(config: WebhookConfig & { integrationId: string }): Promise<{ webhookId: string; secret: string }> {
    const response = await apiClient.post('/webhooks', config);
    return response.data.data;
  }

  async updateWebhook(webhookId: string, config: Partial<WebhookConfig>): Promise<void> {
    await apiClient.put(`/webhooks/${webhookId}`, config);
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await apiClient.delete(`/webhooks/${webhookId}`);
  }

  async getWebhookLogs(webhookId: string, limit = 50): Promise<IntegrationLog[]> {
    const response = await apiClient.get(`/webhooks/${webhookId}/logs`, {
      params: { limit }
    });
    return response.data.data;
  }

  // Data Synchronization
  async syncCandidates(integrationId: string, candidateIds?: string[]): Promise<{ success: boolean; synced: number; errors: string[] }> {
    const response = await apiClient.post(`/integrations/${integrationId}/sync/candidates`, {
      candidateIds
    });
    return response.data;
  }

  async syncJobs(integrationId: string, jobIds?: string[]): Promise<{ success: boolean; synced: number; errors: string[] }> {
    const response = await apiClient.post(`/integrations/${integrationId}/sync/jobs`, {
      jobIds
    });
    return response.data;
  }

  async syncPipelines(integrationId: string, pipelineIds?: string[]): Promise<{ success: boolean; synced: number; errors: string[] }> {
    const response = await apiClient.post(`/integrations/${integrationId}/sync/pipelines`, {
      pipelineIds
    });
    return response.data;
  }

  // Real-time Data Push
  async pushCandidate(integrationId: string, candidate: Candidate): Promise<{ success: boolean; message?: string }> {
    try {
      const integration = await this.getIntegration(integrationId);
      
      if (!integration.enabled) {
        throw new Error('Integration is disabled');
      }

      switch (integration.type) {
        case 'webhook':
          return await this.sendWebhook(integration, 'candidate.created', candidate);
        case 'api':
          return await this.pushToApi(integration, 'candidates', candidate);
        default:
          throw new Error(`Unsupported integration type: ${integration.type}`);
      }
    } catch (error) {
      await this.logIntegrationError(integrationId, 'push_candidate', error);
      throw error;
    }
  }

  async pushJob(integrationId: string, job: JobDescription): Promise<{ success: boolean; message?: string }> {
    try {
      const integration = await this.getIntegration(integrationId);
      
      if (!integration.enabled) {
        throw new Error('Integration is disabled');
      }

      switch (integration.type) {
        case 'webhook':
          return await this.sendWebhook(integration, 'job.created', job);
        case 'api':
          return await this.pushToApi(integration, 'jobs', job);
        default:
          throw new Error(`Unsupported integration type: ${integration.type}`);
      }
    } catch (error) {
      await this.logIntegrationError(integrationId, 'push_job', error);
      throw error;
    }
  }

  async pushPipelineUpdate(integrationId: string, pipeline: PipelineRun): Promise<{ success: boolean; message?: string }> {
    try {
      const integration = await this.getIntegration(integrationId);
      
      if (!integration.enabled) {
        throw new Error('Integration is disabled');
      }

      switch (integration.type) {
        case 'webhook':
          return await this.sendWebhook(integration, 'pipeline.updated', pipeline);
        case 'api':
          return await this.pushToApi(integration, 'pipelines', pipeline);
        default:
          throw new Error(`Unsupported integration type: ${integration.type}`);
      }
    } catch (error) {
      await this.logIntegrationError(integrationId, 'push_pipeline', error);
      throw error;
    }
  }

  // Webhook Sending
  private async sendWebhook(integration: IntegrationConfig, event: string, data: any): Promise<{ success: boolean; message?: string }> {
    const webhookConfig = integration.settings as WebhookConfig;
    
    if (!webhookConfig.events.includes(event)) {
      return { success: true, message: 'Event not configured for this webhook' };
    }

    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      integrationId: integration.id
    };

    const headers = {
      'Content-Type': 'application/json',
      ...webhookConfig.headers
    };

    // Add authentication headers
    if (webhookConfig.authentication) {
      switch (webhookConfig.authentication.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${webhookConfig.authentication.credentials.token}`;
          break;
        case 'basic':
          const credentials = btoa(`${webhookConfig.authentication.credentials.username}:${webhookConfig.authentication.credentials.password}`);
          headers['Authorization'] = `Basic ${credentials}`;
          break;
        case 'api_key':
          headers[webhookConfig.authentication.credentials.headerName || 'X-API-Key'] = webhookConfig.authentication.credentials.apiKey;
          break;
      }
    }

    try {
      const response = await fetch(webhookConfig.url, {
        method: webhookConfig.method,
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}: ${response.statusText}`);
      }

      await this.logIntegrationSuccess(integration.id, 'webhook', `Successfully sent ${event} webhook`);
      return { success: true };
    } catch (error) {
      // Implement retry logic
      await this.scheduleRetry(integration.id, 'webhook', payload, webhookConfig.retryPolicy);
      throw error;
    }
  }

  // API Push
  private async pushToApi(integration: IntegrationConfig, endpoint: string, data: any): Promise<{ success: boolean; message?: string }> {
    const apiConfig = integration.settings as ApiIntegrationConfig;
    
    if (!apiConfig.endpoints[endpoint as keyof typeof apiConfig.endpoints]) {
      throw new Error(`Endpoint ${endpoint} not configured for this integration`);
    }

    const url = `${apiConfig.baseUrl}${apiConfig.endpoints[endpoint as keyof typeof apiConfig.endpoints]}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add authentication headers
    switch (apiConfig.authentication.type) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${apiConfig.authentication.credentials.token}`;
        break;
      case 'basic':
        const credentials = btoa(`${apiConfig.authentication.credentials.username}:${apiConfig.authentication.credentials.password}`);
        headers['Authorization'] = `Basic ${credentials}`;
        break;
      case 'api_key':
        headers[apiConfig.authentication.credentials.headerName || 'X-API-Key'] = apiConfig.authentication.credentials.apiKey;
        break;
    }

    // Transform data based on mapping
    const transformedData = this.transformDataForApi(data, apiConfig.mapping);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(transformedData)
      });

      if (!response.ok) {
        throw new Error(`API push failed with status ${response.status}: ${response.statusText}`);
      }

      await this.logIntegrationSuccess(integration.id, 'api_push', `Successfully pushed data to ${endpoint}`);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Data Transformation
  private transformDataForApi(data: any, mapping: Record<string, string>): any {
    const transformed: Record<string, any> = {};
    
    for (const [targetField, sourceField] of Object.entries(mapping)) {
      const value = this.getNestedValue(data, sourceField);
      if (value !== undefined) {
        transformed[targetField] = value;
      }
    }
    
    return transformed;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Retry Logic
  private async scheduleRetry(integrationId: string, type: string, payload: any, retryPolicy: WebhookConfig['retryPolicy']): Promise<void> {
    const queueKey = `${integrationId}_${type}`;
    
    if (!this.retryQueues.has(queueKey)) {
      this.retryQueues.set(queueKey, []);
    }
    
    const queue = this.retryQueues.get(queueKey)!;
    const retryItem = {
      payload,
      attempts: 0,
      maxRetries: retryPolicy.maxRetries,
      nextRetry: Date.now() + 1000 // Start with 1 second delay
    };
    
    queue.push(retryItem);
    
    // Process retry queue
    setTimeout(() => this.processRetryQueue(integrationId, type, retryPolicy), 1000);
  }

  private async processRetryQueue(integrationId: string, type: string, retryPolicy: WebhookConfig['retryPolicy']): Promise<void> {
    const queueKey = `${integrationId}_${type}`;
    const queue = this.retryQueues.get(queueKey);
    
    if (!queue || queue.length === 0) return;
    
    const now = Date.now();
    const readyItems = queue.filter(item => item.nextRetry <= now);
    
    for (const item of readyItems) {
      try {
        const integration = await this.getIntegration(integrationId);
        
        if (type === 'webhook') {
          await this.sendWebhook(integration, item.payload.event, item.payload.data);
        }
        
        // Remove successful item from queue
        const index = queue.indexOf(item);
        if (index > -1) {
          queue.splice(index, 1);
        }
      } catch (error) {
        item.attempts++;
        
        if (item.attempts >= item.maxRetries) {
          // Remove failed item after max retries
          const index = queue.indexOf(item);
          if (index > -1) {
            queue.splice(index, 1);
          }
          
          await this.logIntegrationError(integrationId, `${type}_retry_failed`, error);
        } else {
          // Schedule next retry with exponential backoff
          const delay = Math.min(
            1000 * Math.pow(retryPolicy.backoffMultiplier, item.attempts),
            retryPolicy.maxBackoffTime
          );
          item.nextRetry = now + delay;
          
          setTimeout(() => this.processRetryQueue(integrationId, type, retryPolicy), delay);
        }
      }
    }
  }

  // Logging
  private async logIntegrationSuccess(integrationId: string, type: string, message: string): Promise<void> {
    try {
      await apiClient.post('/integrations/logs', {
        integrationId,
        type,
        status: 'success',
        message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log integration success:', error);
    }
  }

  private async logIntegrationError(integrationId: string, type: string, error: any): Promise<void> {
    try {
      await apiClient.post('/integrations/logs', {
        integrationId,
        type,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? { stack: error.stack } : { error },
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log integration error:', logError);
    }
  }

  // Integration Logs
  async getIntegrationLogs(integrationId: string, limit = 50): Promise<IntegrationLog[]> {
    const response = await apiClient.get(`/integrations/${integrationId}/logs`, {
      params: { limit }
    });
    return response.data.data;
  }

  async clearIntegrationLogs(integrationId: string): Promise<void> {
    await apiClient.delete(`/integrations/${integrationId}/logs`);
  }

  // Health Check
  async checkIntegrationHealth(integrationId: string): Promise<{ healthy: boolean; lastSync?: Date; errors: string[] }> {
    const response = await apiClient.get(`/integrations/${integrationId}/health`);
    return response.data;
  }

  // Bulk Operations
  async enableIntegration(integrationId: string): Promise<void> {
    await this.updateIntegration(integrationId, { enabled: true });
  }

  async disableIntegration(integrationId: string): Promise<void> {
    await this.updateIntegration(integrationId, { enabled: false });
  }

  async bulkSync(integrationId: string, data: { candidates?: string[]; jobs?: string[]; pipelines?: string[] }): Promise<{
    candidates: { success: boolean; synced: number; errors: string[] };
    jobs: { success: boolean; synced: number; errors: string[] };
    pipelines: { success: boolean; synced: number; errors: string[] };
  }> {
    const results = {
      candidates: { success: true, synced: 0, errors: [] },
      jobs: { success: true, synced: 0, errors: [] },
      pipelines: { success: true, synced: 0, errors: [] }
    };

    if (data.candidates) {
      results.candidates = await this.syncCandidates(integrationId, data.candidates);
    }

    if (data.jobs) {
      results.jobs = await this.syncJobs(integrationId, data.jobs);
    }

    if (data.pipelines) {
      results.pipelines = await this.syncPipelines(integrationId, data.pipelines);
    }

    return results;
  }
}

export const integrationService = new IntegrationService();