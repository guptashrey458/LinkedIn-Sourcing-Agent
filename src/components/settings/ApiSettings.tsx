import React from 'react';
import { Card, Input, Button, Checkbox, Badge } from '../ui';
import { ApiSettings as ApiSettingsType } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import { Save, RotateCcw, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ApiSettingsProps {
  settings: ApiSettingsType;
}

const ApiSettings: React.FC<ApiSettingsProps> = ({ settings }) => {
  const { 
    updateSettings, 
    isUpdatingSettings, 
    testApiConnection, 
    isTestingConnection, 
    connectionTestResult 
  } = useSettings();
  
  const [formData, setFormData] = React.useState(settings);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [testResult, setTestResult] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setFormData(settings);
    setHasChanges(false);
  }, [settings]);

  React.useEffect(() => {
    setTestResult(connectionTestResult ?? null);
  }, [connectionTestResult]);

  const handleChange = (field: keyof ApiSettingsType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setTestResult(null); // Reset test result when settings change
  };

  const handleEndpointChange = (endpoint: keyof ApiSettingsType['endpoints'], value: string) => {
    setFormData(prev => ({
      ...prev,
      endpoints: { ...prev.endpoints, [endpoint]: value }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings('api', formData);
    setHasChanges(false);
  };

  const handleReset = () => {
    setFormData(settings);
    setHasChanges(false);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    try {
      const result = await testApiConnection(formData.baseUrl, formData.timeout);
      setTestResult(result);
    } catch (error) {
      setTestResult(false);
    }
  };

  const getConnectionStatus = () => {
    if (testResult === null) return null;
    
    if (testResult) {
      return (
        <Badge variant="success" className="flex items-center">
          <CheckCircle className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    } else {
      return (
        <Badge variant="error" className="flex items-center">
          <XCircle className="w-3 h-3 mr-1" />
          Connection Failed
        </Badge>
      );
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">API Configuration</h3>
          <p className="text-sm text-gray-600">Configure API endpoints and connection settings</p>
        </div>
        <div className="flex space-x-2">
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Reset
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={isUpdatingSettings}
            disabled={!hasChanges}
            icon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Connection Settings */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Connection Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base URL
              </label>
              <div className="flex space-x-2">
                <Input
                  type="url"
                  value={formData.baseUrl}
                  onChange={(e) => handleChange('baseUrl', e.target.value)}
                  placeholder="https://api.example.com"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  loading={isTestingConnection}
                  icon={<TestTube className="w-4 h-4" />}
                >
                  Test
                </Button>
              </div>
              {getConnectionStatus() && (
                <div className="mt-2">
                  {getConnectionStatus()}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout (ms)
              </label>
              <Input
                type="number"
                value={formData.timeout}
                onChange={(e) => handleChange('timeout', Number(e.target.value))}
                min={1000}
                max={300000}
                step={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                Request timeout in milliseconds (1-300 seconds)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retry Attempts
              </label>
              <Input
                type="number"
                value={formData.retryAttempts}
                onChange={(e) => handleChange('retryAttempts', Number(e.target.value))}
                min={0}
                max={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of retry attempts for failed requests
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retry Delay (ms)
              </label>
              <Input
                type="number"
                value={formData.retryDelay}
                onChange={(e) => handleChange('retryDelay', Number(e.target.value))}
                min={100}
                max={10000}
                step={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                Delay between retry attempts
              </p>
            </div>
          </div>
        </div>

        {/* Caching Settings */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Caching Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={formData.enableCaching}
                onChange={(checked) => handleChange('enableCaching', checked)}
                label="Enable API Caching"
                description="Cache API responses to improve performance"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cache Timeout (ms)
              </label>
              <Input
                type="number"
                value={formData.cacheTimeout}
                onChange={(e) => handleChange('cacheTimeout', Number(e.target.value))}
                min={60000}
                max={3600000}
                step={60000}
                disabled={!formData.enableCaching}
              />
              <p className="text-xs text-gray-500 mt-1">
                How long to cache responses (1-60 minutes)
              </p>
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">API Endpoints</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidates Endpoint
              </label>
              <Input
                value={formData.endpoints.candidates}
                onChange={(e) => handleEndpointChange('candidates', e.target.value)}
                placeholder="/api/candidates"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jobs Endpoint
              </label>
              <Input
                value={formData.endpoints.jobs}
                onChange={(e) => handleEndpointChange('jobs', e.target.value)}
                placeholder="/api/jobs"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pipelines Endpoint
              </label>
              <Input
                value={formData.endpoints.pipelines}
                onChange={(e) => handleEndpointChange('pipelines', e.target.value)}
                placeholder="/api/pipelines"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Messages Endpoint
              </label>
              <Input
                value={formData.endpoints.messages}
                onChange={(e) => handleEndpointChange('messages', e.target.value)}
                placeholder="/api/messages"
              />
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Authentication</h4>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h5 className="text-sm font-medium text-blue-900">Authentication Configuration</h5>
                <p className="text-sm text-blue-700 mt-1">
                  Authentication credentials are managed automatically through the login system. 
                  Manual configuration is not required for normal operation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            You have unsaved changes. Click "Save Changes" to apply them.
          </p>
        </div>
      )}
    </Card>
  );
};

export default ApiSettings;