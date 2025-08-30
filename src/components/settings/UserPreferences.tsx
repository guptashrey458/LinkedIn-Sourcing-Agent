import React from 'react';
import { Card, Button, Checkbox, Select } from '../ui';
import { UserPreferences as UserPreferencesType } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import { Save, RotateCcw, User, Layout, Eye, Keyboard } from 'lucide-react';

interface UserPreferencesProps {
  preferences: UserPreferencesType;
}

const UserPreferences: React.FC<UserPreferencesProps> = ({ preferences }) => {
  const { updatePreferences, isUpdatingPreferences } = useSettings();
  const [formData, setFormData] = React.useState(preferences);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    setFormData(preferences);
    setHasChanges(false);
  }, [preferences]);

  const handleChange = (section: keyof UserPreferencesType, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
    setHasChanges(true);
  };

  const handleAccessibilityChange = (field: keyof UserPreferencesType['accessibility'], value: any) => {
    setFormData(prev => ({
      ...prev,
      accessibility: { ...prev.accessibility, [field]: value }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updatePreferences(formData);
    setHasChanges(false);
  };

  const handleReset = () => {
    setFormData(preferences);
    setHasChanges(false);
  };

  const viewOptions = [
    { value: 'grid', label: 'Grid View' },
    { value: 'list', label: 'List View' },
    { value: 'table', label: 'Table View' },
  ];

  const layoutOptions = [
    { value: 'grid', label: 'Grid Layout' },
    { value: 'list', label: 'List Layout' },
  ];

  const refreshIntervalOptions = [
    { value: 5000, label: '5 seconds' },
    { value: 10000, label: '10 seconds' },
    { value: 30000, label: '30 seconds' },
    { value: 60000, label: '1 minute' },
    { value: 300000, label: '5 minutes' },
    { value: 0, label: 'Manual only' },
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'extra-large', label: 'Extra Large' },
  ];

  const candidateSortOptions = [
    { value: 'score', label: 'Score (Highest first)' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'createdAt', label: 'Date Added (Newest first)' },
    { value: 'experience', label: 'Experience (Most first)' },
  ];

  const jobSortOptions = [
    { value: 'createdAt', label: 'Date Created (Newest first)' },
    { value: 'title', label: 'Job Title (A-Z)' },
    { value: 'status', label: 'Status' },
    { value: 'company', label: 'Company (A-Z)' },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">User Preferences</h3>
          <p className="text-sm text-gray-600">Customize your personal experience and accessibility settings</p>
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
            loading={isUpdatingPreferences}
            disabled={!hasChanges}
            icon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Dashboard Preferences */}
        <div>
          <div className="flex items-center mb-4">
            <Layout className="w-5 h-5 text-gray-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Dashboard</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Layout Style
              </label>
              <Select
                value={formData.dashboard.layout}
                onChange={(value) => handleChange('dashboard', 'layout', value)}
                options={layoutOptions}
                placeholder="Select layout"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-refresh Interval
              </label>
              <Select
                value={formData.dashboard.refreshInterval}
                onChange={(value) => handleChange('dashboard', 'refreshInterval', Number(value))}
                options={refreshIntervalOptions}
                placeholder="Select refresh interval"
              />
            </div>
          </div>
        </div>

        {/* Candidates Preferences */}
        <div>
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-gray-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Candidates</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default View
              </label>
              <Select
                value={formData.candidates.defaultView}
                onChange={(value) => handleChange('candidates', 'defaultView', value)}
                options={viewOptions}
                placeholder="Select default view"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Sort
              </label>
              <Select
                value={formData.candidates.defaultSort}
                onChange={(value) => handleChange('candidates', 'defaultSort', value)}
                options={candidateSortOptions}
                placeholder="Select default sort"
              />
            </div>
          </div>
        </div>

        {/* Jobs Preferences */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Jobs</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default View
              </label>
              <Select
                value={formData.jobs.defaultView}
                onChange={(value) => handleChange('jobs', 'defaultView', value)}
                options={viewOptions}
                placeholder="Select default view"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Sort
              </label>
              <Select
                value={formData.jobs.defaultSort}
                onChange={(value) => handleChange('jobs', 'defaultSort', value)}
                options={jobSortOptions}
                placeholder="Select default sort"
              />
            </div>
          </div>
        </div>

        {/* Pipeline Preferences */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Pipeline Monitoring</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
            <div className="flex items-center">
              <Checkbox
                checked={formData.pipeline.autoRefresh}
                onChange={(checked) => handleChange('pipeline', 'autoRefresh', checked)}
                label="Auto-refresh pipeline status"
                description="Automatically update pipeline information"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refresh Interval
              </label>
              <Select
                value={formData.pipeline.refreshInterval}
                onChange={(value) => handleChange('pipeline', 'refreshInterval', Number(value))}
                options={refreshIntervalOptions.filter(opt => opt.value > 0)}
                disabled={!formData.pipeline.autoRefresh}
                placeholder="Select refresh interval"
              />
            </div>

            <div className="flex items-center">
              <Checkbox
                checked={formData.pipeline.showDetails}
                onChange={(checked) => handleChange('pipeline', 'showDetails', checked)}
                label="Show detailed pipeline information"
                description="Display verbose pipeline logs and metrics"
              />
            </div>
          </div>
        </div>

        {/* Accessibility Settings */}
        <div>
          <div className="flex items-center mb-4">
            <Eye className="w-5 h-5 text-gray-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Accessibility</h4>
          </div>
          
          <div className="ml-7 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Checkbox
                  checked={formData.accessibility.highContrast}
                  onChange={(checked) => handleAccessibilityChange('highContrast', checked)}
                  label="High contrast mode"
                  description="Increase color contrast for better visibility"
                />
              </div>

              <div className="flex items-center">
                <Checkbox
                  checked={formData.accessibility.reducedMotion}
                  onChange={(checked) => handleAccessibilityChange('reducedMotion', checked)}
                  label="Reduce motion"
                  description="Minimize animations and transitions"
                />
              </div>

              <div className="flex items-center">
                <Checkbox
                  checked={formData.accessibility.screenReader}
                  onChange={(checked) => handleAccessibilityChange('screenReader', checked)}
                  label="Screen reader support"
                  description="Optimize for screen reader compatibility"
                />
              </div>

              <div className="flex items-center">
                <Checkbox
                  checked={formData.accessibility.keyboardNavigation}
                  onChange={(checked) => handleAccessibilityChange('keyboardNavigation', checked)}
                  label="Enhanced keyboard navigation"
                  description="Improve keyboard-only navigation experience"
                />
              </div>
            </div>

            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accessibility Font Size
              </label>
              <Select
                value={formData.accessibility.fontSize}
                onChange={(value) => handleAccessibilityChange('fontSize', value)}
                options={fontSizeOptions}
                placeholder="Select font size"
              />
              <p className="text-xs text-gray-500 mt-1">
                Override global font size for accessibility
              </p>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div>
          <div className="flex items-center mb-4">
            <Keyboard className="w-5 h-5 text-gray-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Keyboard Shortcuts</h4>
          </div>
          
          <div className="ml-7 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Navigation</h5>
                <div className="space-y-1 text-gray-600">
                  <div className="flex justify-between">
                    <span>Dashboard</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl + D</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Candidates</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl + C</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Jobs</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl + J</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Pipeline</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl + P</kbd>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Actions</h5>
                <div className="space-y-1 text-gray-600">
                  <div className="flex justify-between">
                    <span>Search</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl + K</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>New Job</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl + N</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Settings</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl + ,</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Help</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">F1</kbd>
                  </div>
                </div>
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

export default UserPreferences;