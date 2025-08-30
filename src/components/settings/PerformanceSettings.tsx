import React from 'react';
import { Card, Input, Button, Checkbox, Select, Badge } from '../ui';
import { PerformanceSettings as PerformanceSettingsType } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import { Save, RotateCcw, Zap, Database, Wifi, HardDrive } from 'lucide-react';

interface PerformanceSettingsProps {
  settings: PerformanceSettingsType;
}

const PerformanceSettings: React.FC<PerformanceSettingsProps> = ({ settings }) => {
  const { updateSettings, isUpdatingSettings } = useSettings();
  const [formData, setFormData] = React.useState(settings);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    setFormData(settings);
    setHasChanges(false);
  }, [settings]);

  const handleChange = (field: keyof PerformanceSettingsType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings('performance', formData);
    setHasChanges(false);
  };

  const handleReset = () => {
    setFormData(settings);
    setHasChanges(false);
  };

  const pageSizeOptions = [
    { value: 10, label: '10 items' },
    { value: 25, label: '25 items' },
    { value: 50, label: '50 items' },
    { value: 100, label: '100 items' },
    { value: 200, label: '200 items' },
    { value: 500, label: '500 items' },
    { value: 1000, label: '1000 items' },
  ];

  const cacheSizeOptions = [
    { value: 10, label: '10 MB' },
    { value: 25, label: '25 MB' },
    { value: 50, label: '50 MB' },
    { value: 100, label: '100 MB' },
    { value: 250, label: '250 MB' },
    { value: 500, label: '500 MB' },
    { value: 1000, label: '1 GB' },
  ];

  const compressionOptions = [
    { value: 'none', label: 'None', description: 'No compression (fastest)' },
    { value: 'low', label: 'Low', description: 'Basic compression' },
    { value: 'medium', label: 'Medium', description: 'Balanced compression' },
    { value: 'high', label: 'High', description: 'Maximum compression (slowest)' },
  ];

  const getPerformanceScore = () => {
    let score = 0;
    let maxScore = 7;

    if (formData.enableVirtualScrolling) score += 1;
    if (formData.pageSize <= 100) score += 1;
    if (formData.cacheSize >= 50) score += 1;
    if (formData.preloadImages) score += 1;
    if (formData.enableServiceWorker) score += 1;
    if (formData.compressionLevel !== 'none') score += 1;
    if (formData.offlineMode) score += 1;

    return Math.round((score / maxScore) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const clearCache = () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Clear localStorage cache items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_') || key.startsWith('query_')) {
        localStorage.removeItem(key);
      }
    });

    alert('Cache cleared successfully');
  };

  const estimateMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    return null;
  };

  const memoryInfo = estimateMemoryUsage();
  const performanceScore = getPerformanceScore();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Performance Settings</h3>
          <p className="text-sm text-gray-600">Optimize application performance and resource usage</p>
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
        {/* Performance Score */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h4 className="text-lg font-medium text-blue-900">Performance Score</h4>
                <p className="text-sm text-blue-700">Based on your current settings</p>
              </div>
            </div>
            <Badge variant={getScoreColor(performanceScore)} className="text-lg px-4 py-2">
              {performanceScore}%
            </Badge>
          </div>
        </div>

        {/* Data Loading */}
        <div>
          <div className="flex items-center mb-4">
            <Database className="w-5 h-5 text-gray-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Data Loading</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
            <div className="flex items-center">
              <Checkbox
                checked={formData.enableVirtualScrolling}
                onChange={(checked) => handleChange('enableVirtualScrolling', checked)}
                label="Enable virtual scrolling"
                description="Improve performance for large lists by rendering only visible items"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Page Size
              </label>
              <Select
                value={formData.pageSize}
                onChange={(value) => handleChange('pageSize', Number(value))}
                options={pageSizeOptions}
                placeholder="Select page size"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of items to load per page
              </p>
            </div>

            <div className="flex items-center">
              <Checkbox
                checked={formData.preloadImages}
                onChange={(checked) => handleChange('preloadImages', checked)}
                label="Preload images"
                description="Load images in advance to improve user experience"
              />
            </div>
          </div>
        </div>

        {/* Caching */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <HardDrive className="w-5 h-5 text-gray-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">Caching</h4>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCache}
            >
              Clear Cache
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cache Size Limit
              </label>
              <Select
                value={formData.cacheSize}
                onChange={(value) => handleChange('cacheSize', Number(value))}
                options={cacheSizeOptions}
                placeholder="Select cache size"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum amount of data to cache locally
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compression Level
              </label>
              <Select
                value={formData.compressionLevel}
                onChange={(value) => handleChange('compressionLevel', value)}
                options={compressionOptions}
                placeholder="Select compression level"
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher compression saves bandwidth but uses more CPU
              </p>
            </div>
          </div>
        </div>

        {/* Offline & Service Worker */}
        <div>
          <div className="flex items-center mb-4">
            <Wifi className="w-5 h-5 text-gray-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Offline Support</h4>
          </div>
          
          <div className="ml-7 space-y-3">
            <Checkbox
              checked={formData.enableServiceWorker}
              onChange={(checked) => handleChange('enableServiceWorker', checked)}
              label="Enable service worker"
              description="Cache resources for faster loading and offline access"
            />

            <Checkbox
              checked={formData.offlineMode}
              onChange={(checked) => handleChange('offlineMode', checked)}
              disabled={!formData.enableServiceWorker}
              label="Enable offline mode"
              description="Allow limited functionality when offline"
            />
          </div>
        </div>

        {/* Memory Usage */}
        {memoryInfo && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Memory Usage</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{memoryInfo.used} MB</div>
                <div className="text-sm text-gray-600">Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{memoryInfo.total} MB</div>
                <div className="text-sm text-gray-600">Allocated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{memoryInfo.limit} MB</div>
                <div className="text-sm text-gray-600">Limit</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(memoryInfo.used / memoryInfo.limit) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Memory usage: {Math.round((memoryInfo.used / memoryInfo.limit) * 100)}%
              </p>
            </div>
          </div>
        )}

        {/* Performance Tips */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h5 className="text-sm font-medium text-green-900 mb-2">Performance Tips</h5>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Enable virtual scrolling for better performance with large datasets</li>
            <li>• Use smaller page sizes if you experience slow loading</li>
            <li>• Enable service worker for faster subsequent page loads</li>
            <li>• Higher compression levels reduce bandwidth usage</li>
            <li>• Clear cache periodically to free up storage space</li>
          </ul>
        </div>

        {/* Performance Warnings */}
        {(formData.pageSize > 500 || !formData.enableVirtualScrolling) && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h5 className="text-sm font-medium text-amber-900 mb-2">Performance Warnings</h5>
            <ul className="text-sm text-amber-700 space-y-1">
              {formData.pageSize > 500 && (
                <li>• Large page sizes may cause slow loading and high memory usage</li>
              )}
              {!formData.enableVirtualScrolling && (
                <li>• Disabling virtual scrolling may cause performance issues with large lists</li>
              )}
            </ul>
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

export default PerformanceSettings;