import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Checkbox } from '../ui/Checkbox';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { IntegrationConfig, WebhookConfig, ApiIntegrationConfig } from '../../types';
import { integrationService } from '../../services/integrationService';
import { X, Plus, Trash2, TestTube, AlertCircle, Check } from 'lucide-react';

interface IntegrationConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  integration?: IntegrationConfig;
  onSave: (integration: IntegrationConfig) => void;
}

export const IntegrationConfigDialog: React.FC<IntegrationConfigDialogProps> = ({
  isOpen,
  onClose,
  integration,
  onSave
}) => {
  const [config, setConfig] = useState<Partial<IntegrationConfig>>({
    name: '',
    type: 'webhook',
    enabled: true,
    settings: {}
  });

  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (integration) {
      setConfig(integration);
    } else {
      setConfig({
        name: '',
        type: 'webhook',
        enabled: true,
        settings: {}
      });
    }
    setTestResult(null);
  }, [integration, isOpen]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      let savedIntegration: IntegrationConfig;
      
      if (integration) {
        savedIntegration = await integrationService.updateIntegration(integration.id, config);
      } else {
        savedIntegration = await integrationService.createIntegration(config as Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>);
      }
      
      onSave(savedIntegration);
      onClose();
    } catch (error) {
      console.error('Failed to save integration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!integration) return;
    
    try {
      setIsLoading(true);
      const result = await integrationService.testIntegration(integration.id);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = (updates: Partial<WebhookConfig | ApiIntegrationConfig>) => {
    setConfig(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...updates
      }
    }));
  };

  const renderWebhookSettings = () => {
    const settings = config.settings as WebhookConfig;
    
    return (
      <div className="space-y-4">
        <Input
          label="Webhook URL"
          value={settings.url || ''}
          onChange={(e) => updateSettings({ url: e.target.value })}
          placeholder="https://your-app.com/webhooks/linkedin-sourcing"
          required
        />
        
        <Select
          label="HTTP Method"
          value={settings.method || 'POST'}
          onChange={(e) => updateSettings({ method: e.target.value as 'POST' | 'PUT' | 'PATCH' })}
          options={[
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'PATCH', label: 'PATCH' }
          ]}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Events to Send
          </label>
          <div className="space-y-2">
            {[
              { value: 'candidate.created', label: 'Candidate Created' },
              { value: 'candidate.updated', label: 'Candidate Updated' },
              { value: 'job.created', label: 'Job Created' },
              { value: 'job.updated', label: 'Job Updated' },
              { value: 'pipeline.started', label: 'Pipeline Started' },
              { value: 'pipeline.completed', label: 'Pipeline Completed' },
              { value: 'pipeline.failed', label: 'Pipeline Failed' }
            ].map((event) => (
              <Checkbox
                key={event.value}
                checked={settings.events?.includes(event.value) || false}
                onChange={(checked) => {
                  const events = settings.events || [];
                  if (checked) {
                    updateSettings({ events: [...events, event.value] });
                  } else {
                    updateSettings({ events: events.filter(e => e !== event.value) });
                  }
                }}
                label={event.label}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Headers
          </label>
          <div className="space-y-2">
            {Object.entries(settings.headers || {}).map(([key, value], index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="Header name"
                  value={key}
                  onChange={(e) => {
                    const newHeaders = { ...settings.headers };
                    delete newHeaders[key];
                    newHeaders[e.target.value] = value;
                    updateSettings({ headers: newHeaders });
                  }}
                />
                <Input
                  placeholder="Header value"
                  value={value}
                  onChange={(e) => {
                    updateSettings({
                      headers: {
                        ...settings.headers,
                        [key]: e.target.value
                      }
                    });
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newHeaders = { ...settings.headers };
                    delete newHeaders[key];
                    updateSettings({ headers: newHeaders });
                  }}
                  icon={<Trash2 className="w-4 h-4" />}
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateSettings({
                  headers: {
                    ...settings.headers,
                    '': ''
                  }
                });
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Header
            </Button>
          </div>
        </div>

        <Card title="Authentication" className="p-4">
          <div className="space-y-4">
            <Select
              label="Authentication Type"
              value={settings.authentication?.type || 'none'}
              onChange={(e) => {
                const type = e.target.value;
                if (type === 'none') {
                  updateSettings({ authentication: undefined });
                } else {
                  updateSettings({
                    authentication: {
                      type: type as 'bearer' | 'basic' | 'api_key',
                      credentials: {}
                    }
                  });
                }
              }}
              options={[
                { value: 'none', label: 'None' },
                { value: 'bearer', label: 'Bearer Token' },
                { value: 'basic', label: 'Basic Auth' },
                { value: 'api_key', label: 'API Key' }
              ]}
            />

            {settings.authentication?.type === 'bearer' && (
              <Input
                label="Bearer Token"
                type="password"
                value={settings.authentication.credentials.token || ''}
                onChange={(e) => updateSettings({
                  authentication: {
                    ...settings.authentication!,
                    credentials: {
                      ...settings.authentication!.credentials,
                      token: e.target.value
                    }
                  }
                })}
              />
            )}

            {settings.authentication?.type === 'basic' && (
              <>
                <Input
                  label="Username"
                  value={settings.authentication.credentials.username || ''}
                  onChange={(e) => updateSettings({
                    authentication: {
                      ...settings.authentication!,
                      credentials: {
                        ...settings.authentication!.credentials,
                        username: e.target.value
                      }
                    }
                  })}
                />
                <Input
                  label="Password"
                  type="password"
                  value={settings.authentication.credentials.password || ''}
                  onChange={(e) => updateSettings({
                    authentication: {
                      ...settings.authentication!,
                      credentials: {
                        ...settings.authentication!.credentials,
                        password: e.target.value
                      }
                    }
                  })}
                />
              </>
            )}

            {settings.authentication?.type === 'api_key' && (
              <>
                <Input
                  label="API Key"
                  type="password"
                  value={settings.authentication.credentials.apiKey || ''}
                  onChange={(e) => updateSettings({
                    authentication: {
                      ...settings.authentication!,
                      credentials: {
                        ...settings.authentication!.credentials,
                        apiKey: e.target.value
                      }
                    }
                  })}
                />
                <Input
                  label="Header Name"
                  value={settings.authentication.credentials.headerName || 'X-API-Key'}
                  onChange={(e) => updateSettings({
                    authentication: {
                      ...settings.authentication!,
                      credentials: {
                        ...settings.authentication!.credentials,
                        headerName: e.target.value
                      }
                    }
                  })}
                />
              </>
            )}
          </div>
        </Card>

        <Card title="Retry Policy" className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Max Retries"
              type="number"
              value={settings.retryPolicy?.maxRetries || 3}
              onChange={(e) => updateSettings({
                retryPolicy: {
                  ...settings.retryPolicy,
                  maxRetries: parseInt(e.target.value) || 3
                }
              })}
            />
            <Input
              label="Backoff Multiplier"
              type="number"
              step="0.1"
              value={settings.retryPolicy?.backoffMultiplier || 2}
              onChange={(e) => updateSettings({
                retryPolicy: {
                  ...settings.retryPolicy,
                  backoffMultiplier: parseFloat(e.target.value) || 2
                }
              })}
            />
            <Input
              label="Max Backoff (ms)"
              type="number"
              value={settings.retryPolicy?.maxBackoffTime || 30000}
              onChange={(e) => updateSettings({
                retryPolicy: {
                  ...settings.retryPolicy,
                  maxBackoffTime: parseInt(e.target.value) || 30000
                }
              })}
            />
          </div>
        </Card>
      </div>
    );
  };

  const renderApiSettings = () => {
    const settings = config.settings as ApiIntegrationConfig;
    
    return (
      <div className="space-y-4">
        <Input
          label="Base URL"
          value={settings.baseUrl || ''}
          onChange={(e) => updateSettings({ baseUrl: e.target.value })}
          placeholder="https://api.your-ats.com/v1"
          required
        />

        <Card title="Endpoints" className="p-4">
          <div className="space-y-3">
            <Input
              label="Candidates Endpoint"
              value={settings.endpoints?.candidates || ''}
              onChange={(e) => updateSettings({
                endpoints: {
                  ...settings.endpoints,
                  candidates: e.target.value
                }
              })}
              placeholder="/candidates"
            />
            <Input
              label="Jobs Endpoint"
              value={settings.endpoints?.jobs || ''}
              onChange={(e) => updateSettings({
                endpoints: {
                  ...settings.endpoints,
                  jobs: e.target.value
                }
              })}
              placeholder="/jobs"
            />
            <Input
              label="Pipelines Endpoint"
              value={settings.endpoints?.pipelines || ''}
              onChange={(e) => updateSettings({
                endpoints: {
                  ...settings.endpoints,
                  pipelines: e.target.value
                }
              })}
              placeholder="/pipelines"
            />
          </div>
        </Card>

        <Card title="Field Mapping" className="p-4">
          <div className="space-y-2">
            {Object.entries(settings.mapping || {}).map(([targetField, sourceField], index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="Target field"
                  value={targetField}
                  onChange={(e) => {
                    const newMapping = { ...settings.mapping };
                    delete newMapping[targetField];
                    newMapping[e.target.value] = sourceField;
                    updateSettings({ mapping: newMapping });
                  }}
                />
                <span className="text-gray-500">←</span>
                <Input
                  placeholder="Source field"
                  value={sourceField}
                  onChange={(e) => {
                    updateSettings({
                      mapping: {
                        ...settings.mapping,
                        [targetField]: e.target.value
                      }
                    });
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newMapping = { ...settings.mapping };
                    delete newMapping[targetField];
                    updateSettings({ mapping: newMapping });
                  }}
                  icon={<Trash2 className="w-4 h-4" />}
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateSettings({
                  mapping: {
                    ...settings.mapping,
                    '': ''
                  }
                });
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Mapping
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {integration ? 'Edit Integration' : 'Create Integration'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Basic Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Integration Name"
              value={config.name || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My ATS Integration"
              required
            />
            
            <Select
              label="Integration Type"
              value={config.type || 'webhook'}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                type: e.target.value as 'webhook' | 'api' | 'database' | 'file',
                settings: {} // Reset settings when type changes
              }))}
              options={[
                { value: 'webhook', label: 'Webhook' },
                { value: 'api', label: 'REST API' },
                { value: 'database', label: 'Database' },
                { value: 'file', label: 'File Export' }
              ]}
            />
          </div>

          <Checkbox
            checked={config.enabled || false}
            onChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
            label="Enable Integration"
            description="When enabled, this integration will receive real-time updates"
          />

          {/* Type-specific Settings */}
          {config.type === 'webhook' && renderWebhookSettings()}
          {config.type === 'api' && renderApiSettings()}

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg border ${
              testResult.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                {testResult.success ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-medium">
                  {testResult.success ? 'Test Successful' : 'Test Failed'}
                </span>
              </div>
              <p className="mt-1 text-sm">{testResult.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <div>
              {integration && (
                <Button
                  variant="outline"
                  onClick={handleTest}
                  loading={isLoading}
                  icon={<TestTube className="w-4 h-4" />}
                >
                  Test Integration
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                loading={isLoading}
                disabled={!config.name || !config.type}
              >
                {integration ? 'Update' : 'Create'} Integration
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};