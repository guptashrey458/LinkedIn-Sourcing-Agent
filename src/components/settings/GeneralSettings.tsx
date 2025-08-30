import React from 'react';
import { Card, Input, Select, Button, Checkbox } from '../ui';
import { GeneralSettings as GeneralSettingsType } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import { Save, RotateCcw } from 'lucide-react';

interface GeneralSettingsProps {
  settings: GeneralSettingsType;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ settings }) => {
  const { updateSettings, isUpdatingSettings } = useSettings();
  const [formData, setFormData] = React.useState(settings);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    setFormData(settings);
    setHasChanges(false);
  }, [settings]);

  const handleChange = (field: keyof GeneralSettingsType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings('general', formData);
    setHasChanges(false);
  };

  const handleReset = () => {
    setFormData(settings);
    setHasChanges(false);
  };

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'pt', label: 'Português' },
    { value: 'zh', label: '中文' },
    { value: 'ja', label: '日本語' },
  ];

  const timezoneOptions = Intl.supportedValuesOf('timeZone').map(tz => ({
    value: tz,
    label: tz.replace(/_/g, ' ')
  }));

  const dateFormatOptions = [
    { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (US)' },
    { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (EU)' },
    { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (ISO)' },
    { value: 'dd.MM.yyyy', label: 'DD.MM.YYYY (DE)' },
  ];

  const pageSizeOptions = [
    { value: 10, label: '10 items' },
    { value: 25, label: '25 items' },
    { value: 50, label: '50 items' },
    { value: 100, label: '100 items' },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
          <p className="text-sm text-gray-600">Configure basic application preferences</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language & Localization */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Language & Localization</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <Select
              value={formData.language}
              onChange={(value) => handleChange('language', value)}
              options={languageOptions}
              placeholder="Select language"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <Select
              value={formData.timezone}
              onChange={(value) => handleChange('timezone', value)}
              options={timezoneOptions}
              placeholder="Select timezone"
              searchable
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Format
            </label>
            <Select
              value={formData.dateFormat}
              onChange={(value) => handleChange('dateFormat', value)}
              options={dateFormatOptions}
              placeholder="Select date format"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Format
            </label>
            <Select
              value={formData.timeFormat}
              onChange={(value) => handleChange('timeFormat', value)}
              options={[
                { value: '12h', label: '12-hour (AM/PM)' },
                { value: '24h', label: '24-hour' },
              ]}
              placeholder="Select time format"
            />
          </div>
        </div>

        {/* Application Behavior */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Application Behavior</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Page Size
            </label>
            <Select
              value={formData.defaultPageSize}
              onChange={(value) => handleChange('defaultPageSize', Number(value))}
              options={pageSizeOptions}
              placeholder="Select page size"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of items to display per page by default
            </p>
          </div>

          <div className="space-y-3">
            <Checkbox
              checked={formData.autoSave}
              onChange={(checked) => handleChange('autoSave', checked)}
              label="Auto-save changes"
              description="Automatically save form changes after a short delay"
            />

            <Checkbox
              checked={formData.confirmBeforeDelete}
              onChange={(checked) => handleChange('confirmBeforeDelete', checked)}
              label="Confirm before delete"
              description="Show confirmation dialog before deleting items"
            />
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

export default GeneralSettings;