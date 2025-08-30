import React from 'react';
import { Card, Button, Checkbox, Select } from './';
import { UserPreferences } from '../../types';
import { Eye, Keyboard, Volume2, Type } from 'lucide-react';

interface AccessibilitySettingsProps {
  preferences: UserPreferences['accessibility'];
  onUpdate: (preferences: Partial<UserPreferences['accessibility']>) => void;
  className?: string;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  preferences,
  onUpdate,
  className = ''
}) => {
  const handleChange = (field: keyof UserPreferences['accessibility'], value: any) => {
    onUpdate({ [field]: value });
  };

  const fontSizeOptions = [
    { value: 'small', label: 'Small (14px)' },
    { value: 'medium', label: 'Medium (16px)' },
    { value: 'large', label: 'Large (18px)' },
    { value: 'extra-large', label: 'Extra Large (20px)' },
  ];

  const applyAccessibilitySettings = () => {
    const root = document.documentElement;

    // Apply high contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (preferences.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply keyboard navigation
    if (preferences.keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }

    // Apply font size
    const fontSizeClass = `font-size-${preferences.fontSize}`;
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-extra-large');
    root.classList.add(fontSizeClass);

    // Screen reader announcements
    if (preferences.screenReader) {
      // Add aria-live regions for dynamic content
      const liveRegion = document.getElementById('aria-live-region');
      if (!liveRegion) {
        const region = document.createElement('div');
        region.id = 'aria-live-region';
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-atomic', 'true');
        region.className = 'sr-only';
        document.body.appendChild(region);
      }
    }
  };

  React.useEffect(() => {
    applyAccessibilitySettings();
  }, [preferences]);

  const announceToScreenReader = (message: string) => {
    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  };

  const testScreenReader = () => {
    announceToScreenReader('Screen reader test: This is a test announcement for accessibility.');
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center mb-6">
        <Eye className="w-5 h-5 text-blue-600 mr-3" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">Accessibility Settings</h3>
          <p className="text-sm text-gray-600">Configure accessibility features for better usability</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Visual Accessibility */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            Visual Accessibility
          </h4>
          
          <div className="space-y-3 ml-6">
            <Checkbox
              checked={preferences.highContrast}
              onChange={(checked) => handleChange('highContrast', checked)}
              label="High contrast mode"
              description="Increase color contrast for better visibility"
            />

            <Checkbox
              checked={preferences.reducedMotion}
              onChange={(checked) => handleChange('reducedMotion', checked)}
              label="Reduce motion"
              description="Minimize animations and transitions"
            />

            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <Select
                value={preferences.fontSize}
                onChange={(value) => handleChange('fontSize', value)}
                options={fontSizeOptions}
                placeholder="Select font size"
              />
            </div>
          </div>
        </div>

        {/* Keyboard Navigation */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <Keyboard className="w-4 h-4 mr-2" />
            Keyboard Navigation
          </h4>
          
          <div className="ml-6">
            <Checkbox
              checked={preferences.keyboardNavigation}
              onChange={(checked) => handleChange('keyboardNavigation', checked)}
              label="Enhanced keyboard navigation"
              description="Improve keyboard-only navigation with better focus indicators"
            />
          </div>
        </div>

        {/* Screen Reader Support */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <Volume2 className="w-4 h-4 mr-2" />
            Screen Reader Support
          </h4>
          
          <div className="space-y-3 ml-6">
            <Checkbox
              checked={preferences.screenReader}
              onChange={(checked) => handleChange('screenReader', checked)}
              label="Screen reader optimization"
              description="Optimize interface for screen reader compatibility"
            />

            {preferences.screenReader && (
              <Button
                variant="outline"
                size="sm"
                onClick={testScreenReader}
              >
                Test Screen Reader
              </Button>
            )}
          </div>
        </div>

        {/* Accessibility Status */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="text-sm font-medium text-blue-900 mb-2">Accessibility Status</h5>
          <div className="space-y-1 text-sm text-blue-700">
            <div className="flex justify-between">
              <span>High Contrast:</span>
              <span className={preferences.highContrast ? 'text-green-600' : 'text-gray-500'}>
                {preferences.highContrast ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Reduced Motion:</span>
              <span className={preferences.reducedMotion ? 'text-green-600' : 'text-gray-500'}>
                {preferences.reducedMotion ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Keyboard Navigation:</span>
              <span className={preferences.keyboardNavigation ? 'text-green-600' : 'text-gray-500'}>
                {preferences.keyboardNavigation ? 'Enhanced' : 'Standard'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Screen Reader:</span>
              <span className={preferences.screenReader ? 'text-green-600' : 'text-gray-500'}>
                {preferences.screenReader ? 'Optimized' : 'Standard'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Font Size:</span>
              <span className="capitalize">{preferences.fontSize}</span>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Reference */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Keyboard className="w-4 h-4 mr-2" />
            Keyboard Shortcuts
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h6 className="font-medium text-gray-700 mb-2">Navigation</h6>
              <div className="space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span>Tab</span>
                  <span>Next element</span>
                </div>
                <div className="flex justify-between">
                  <span>Shift + Tab</span>
                  <span>Previous element</span>
                </div>
                <div className="flex justify-between">
                  <span>Enter/Space</span>
                  <span>Activate element</span>
                </div>
                <div className="flex justify-between">
                  <span>Escape</span>
                  <span>Close modal/menu</span>
                </div>
              </div>
            </div>
            
            <div>
              <h6 className="font-medium text-gray-700 mb-2">Application</h6>
              <div className="space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span>Ctrl + K</span>
                  <span>Search</span>
                </div>
                <div className="flex justify-between">
                  <span>Ctrl + /</span>
                  <span>Show shortcuts</span>
                </div>
                <div className="flex justify-between">
                  <span>Alt + T</span>
                  <span>Toggle theme</span>
                </div>
                <div className="flex justify-between">
                  <span>F1</span>
                  <span>Help</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screen reader live region */}
      <div id="aria-live-region" aria-live="polite" aria-atomic="true" className="sr-only"></div>
    </Card>
  );
};