import React from 'react';
import { Card, Input, Button, Checkbox, Select, Badge } from '../ui';
import { SecuritySettings as SecuritySettingsType } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import { Save, RotateCcw, Shield, Lock, Eye, AlertTriangle } from 'lucide-react';

interface SecuritySettingsProps {
  settings: SecuritySettingsType;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ settings }) => {
  const { updateSettings, isUpdatingSettings } = useSettings();
  const [formData, setFormData] = React.useState(settings);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    setFormData(settings);
    setHasChanges(false);
  }, [settings]);

  const handleChange = (field: keyof SecuritySettingsType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings('security', formData);
    setHasChanges(false);
  };

  const handleReset = () => {
    setFormData(settings);
    setHasChanges(false);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  const sessionTimeoutOptions = [
    { value: 300000, label: '5 minutes' },
    { value: 900000, label: '15 minutes' },
    { value: 1800000, label: '30 minutes' },
    { value: 3600000, label: '1 hour' },
    { value: 7200000, label: '2 hours' },
    { value: 14400000, label: '4 hours' },
    { value: 28800000, label: '8 hours' },
    { value: 86400000, label: '24 hours' },
  ];

  const passwordChangeIntervalOptions = [
    { value: 30, label: '30 days' },
    { value: 60, label: '60 days' },
    { value: 90, label: '90 days' },
    { value: 180, label: '6 months' },
    { value: 365, label: '1 year' },
  ];

  const dataRetentionOptions = [
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' },
    { value: 180, label: '6 months' },
    { value: 365, label: '1 year' },
    { value: 730, label: '2 years' },
    { value: 1825, label: '5 years' },
    { value: 2555, label: '7 years' },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
          <p className="text-sm text-gray-600">Configure security and privacy options</p>
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

      <div className="space-y-8">
        {/* Session Management */}
        <div>
          <div className="flex items-center mb-4">
            <Lock className="w-5 h-5 text-gray-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Session Management</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout
              </label>
              <Select
                value={formData.sessionTimeout}
                onChange={(value) => handleChange('sessionTimeout', Number(value))}
                options={sessionTimeoutOptions}
                placeholder="Select timeout duration"
              />
              <p className="text-xs text-gray-500 mt-1">
                Automatically log out after inactivity
              </p>
            </div>

            <div className="flex items-center">
              <Checkbox
                checked={formData.twoFactorAuth}
                onChange={(checked) => handleChange('twoFactorAuth', checked)}
                label="Two-Factor Authentication"
                description="Require additional verification for login"
              />
            </div>
          </div>
        </div>

        {/* Password Policy */}
        <div>
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-gray-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Password Policy</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
            <div className="flex items-center">
              <Checkbox
                checked={formData.requirePasswordChange}
                onChange={(checked) => handleChange('requirePasswordChange', checked)}
                label="Require periodic password changes"
                description="Force users to change passwords regularly"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Change Interval
              </label>
              <Select
                value={formData.passwordChangeInterval}
                onChange={(value) => handleChange('passwordChangeInterval', Number(value))}
                options={passwordChangeIntervalOptions}
                disabled={!formData.requirePasswordChange}
                placeholder="Select interval"
              />
              <p className="text-xs text-gray-500 mt-1">
                How often users must change passwords
              </p>
            </div>
          </div>
        </div>

        {/* Data Privacy */}
        <div>
          <div className="flex items-center mb-4">
            <Eye className="w-5 h-5 text-gray-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Data Privacy</h4>
          </div>
          
          <div className="space-y-4 ml-7">
            <div className="flex items-center">
              <Checkbox
                checked={formData.auditLogging}
                onChange={(checked) => handleChange('auditLogging', checked)}
                label="Enable audit logging"
                description="Log user actions and system events for security monitoring"
              />
            </div>

            <div className="flex items-center">
              <Checkbox
                checked={formData.anonymizeData}
                onChange={(checked) => handleChange('anonymizeData', checked)}
                label="Anonymize candidate data"
                description="Remove personally identifiable information from exported data"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Retention Period
              </label>
              <Select
                value={formData.dataRetention}
                onChange={(value) => handleChange('dataRetention', Number(value))}
                options={dataRetentionOptions}
                placeholder="Select retention period"
              />
              <p className="text-xs text-gray-500 mt-1">
                How long to keep candidate and pipeline data
              </p>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h5 className="text-sm font-medium text-green-900 mb-2">Security Status</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">Session Security</span>
                  <Badge variant="success">
                    {formatDuration(formData.sessionTimeout)} timeout
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">Two-Factor Auth</span>
                  <Badge variant={formData.twoFactorAuth ? 'success' : 'warning'}>
                    {formData.twoFactorAuth ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">Audit Logging</span>
                  <Badge variant={formData.auditLogging ? 'success' : 'warning'}>
                    {formData.auditLogging ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">Data Anonymization</span>
                  <Badge variant={formData.anonymizeData ? 'success' : 'info'}>
                    {formData.anonymizeData ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Recommendations */}
        {(!formData.twoFactorAuth || !formData.auditLogging) && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h5 className="text-sm font-medium text-amber-900 mb-2">Security Recommendations</h5>
                <ul className="text-sm text-amber-700 space-y-1">
                  {!formData.twoFactorAuth && (
                    <li>• Enable two-factor authentication for enhanced account security</li>
                  )}
                  {!formData.auditLogging && (
                    <li>• Enable audit logging to track security events and user actions</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
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

export default SecuritySettings;