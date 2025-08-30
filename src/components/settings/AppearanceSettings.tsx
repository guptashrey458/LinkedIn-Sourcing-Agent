import React from 'react';
import { Card, Input, Button, Checkbox, Select } from '../ui';
import { AppearanceSettings as AppearanceSettingsType } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../contexts/ThemeContext';
import { Save, RotateCcw, Palette, Sun, Moon, Monitor, Upload, X } from 'lucide-react';

interface AppearanceSettingsProps {
  settings: AppearanceSettingsType;
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ settings }) => {
  const { updateSettings, isUpdatingSettings } = useSettings();
  const { updateAppearance } = useTheme();
  const [formData, setFormData] = React.useState(settings);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    setFormData(settings);
    setHasChanges(false);
    setLogoPreview(settings.customLogo || null);
  }, [settings]);

  const handleChange = (field: keyof AppearanceSettingsType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleBrandingChange = (field: keyof AppearanceSettingsType['customBranding'], value: any) => {
    setFormData(prev => ({
      ...prev,
      customBranding: { ...prev.customBranding, [field]: value }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings('appearance', formData);
    updateAppearance(formData); // Also update theme context
    setHasChanges(false);
  };

  const handleReset = () => {
    setFormData(settings);
    setHasChanges(false);
    setLogoPreview(settings.customLogo || null);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('Logo file size must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        handleChange('customLogo', result);
        handleBrandingChange('logoUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    handleChange('customLogo', undefined);
    handleBrandingChange('logoUrl', undefined);
  };

  const themeOptions = [
    { 
      value: 'light', 
      label: 'Light', 
      icon: <Sun className="w-4 h-4" />,
      description: 'Light theme with bright colors'
    },
    { 
      value: 'dark', 
      label: 'Dark', 
      icon: <Moon className="w-4 h-4" />,
      description: 'Dark theme with muted colors'
    },
    { 
      value: 'system', 
      label: 'System', 
      icon: <Monitor className="w-4 h-4" />,
      description: 'Follow system preference'
    },
  ];

  const fontFamilyOptions = [
    { value: 'Inter', label: 'Inter (Default)' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Nunito', label: 'Nunito' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro' },
    { value: 'system-ui', label: 'System Default' },
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Small (14px)' },
    { value: 'medium', label: 'Medium (16px)' },
    { value: 'large', label: 'Large (18px)' },
  ];

  const presetColors = [
    { name: 'Blue', primary: '#3B82F6', secondary: '#6B7280' },
    { name: 'Indigo', primary: '#6366F1', secondary: '#6B7280' },
    { name: 'Purple', primary: '#8B5CF6', secondary: '#6B7280' },
    { name: 'Pink', primary: '#EC4899', secondary: '#6B7280' },
    { name: 'Red', primary: '#EF4444', secondary: '#6B7280' },
    { name: 'Orange', primary: '#F97316', secondary: '#6B7280' },
    { name: 'Amber', primary: '#F59E0B', secondary: '#6B7280' },
    { name: 'Yellow', primary: '#EAB308', secondary: '#6B7280' },
    { name: 'Lime', primary: '#84CC16', secondary: '#6B7280' },
    { name: 'Green', primary: '#22C55E', secondary: '#6B7280' },
    { name: 'Emerald', primary: '#10B981', secondary: '#6B7280' },
    { name: 'Teal', primary: '#14B8A6', secondary: '#6B7280' },
    { name: 'Cyan', primary: '#06B6D4', secondary: '#6B7280' },
    { name: 'Sky', primary: '#0EA5E9', secondary: '#6B7280' },
  ];

  const applyColorPreset = (preset: typeof presetColors[0]) => {
    handleChange('primaryColor', preset.primary);
    handleChange('secondaryColor', preset.secondary);
    handleBrandingChange('primaryColor', preset.primary);
    handleBrandingChange('secondaryColor', preset.secondary);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Appearance Settings</h3>
          <p className="text-sm text-gray-600">Customize the look and feel of the application</p>
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
        {/* Theme Selection */}
        <div>
          <div className="flex items-center mb-4">
            <Palette className="w-5 h-5 text-gray-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Theme</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-7">
            {themeOptions.map((option) => (
              <div
                key={option.value}
                className={`
                  relative p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${formData.theme === option.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => handleChange('theme', option.value)}
              >
                <div className="flex items-center space-x-3">
                  {option.icon}
                  <div>
                    <h5 className="font-medium text-gray-900">{option.label}</h5>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
                {formData.theme === option.value && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Color Customization */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Colors</h4>
          
          <div className="ml-7 space-y-6">
            {/* Color Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Color Presets
              </label>
              <div className="grid grid-cols-7 gap-2">
                {presetColors.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyColorPreset(preset)}
                    className="group relative w-12 h-12 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all"
                    style={{ backgroundColor: preset.primary }}
                    title={preset.name}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all"></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => {
                      handleChange('primaryColor', e.target.value);
                      handleBrandingChange('primaryColor', e.target.value);
                    }}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => {
                      handleChange('primaryColor', e.target.value);
                      handleBrandingChange('primaryColor', e.target.value);
                    }}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => {
                      handleChange('secondaryColor', e.target.value);
                      handleBrandingChange('secondaryColor', e.target.value);
                    }}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => {
                      handleChange('secondaryColor', e.target.value);
                      handleBrandingChange('secondaryColor', e.target.value);
                    }}
                    placeholder="#6B7280"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Typography</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family
              </label>
              <Select
                value={formData.fontFamily}
                onChange={(value) => handleChange('fontFamily', value)}
                options={fontFamilyOptions}
                placeholder="Select font family"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <Select
                value={formData.fontSize}
                onChange={(value) => handleChange('fontSize', value)}
                options={fontSizeOptions}
                placeholder="Select font size"
              />
            </div>
          </div>
        </div>

        {/* Custom Branding */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Custom Branding</h4>
          
          <div className="ml-7 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <Input
                value={formData.customBranding.companyName}
                onChange={(e) => handleBrandingChange('companyName', e.target.value)}
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Logo
              </label>
              <div className="space-y-3">
                {logoPreview ? (
                  <div className="flex items-center space-x-4">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 object-contain border border-gray-200 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Logo uploaded successfully</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removeLogo}
                        icon={<X className="w-4 h-4" />}
                        className="mt-2"
                      >
                        Remove Logo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload your company logo</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      Choose File
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG, SVG up to 2MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Display Options</h4>
          
          <div className="ml-7 space-y-3">
            <Checkbox
              checked={formData.compactMode}
              onChange={(checked) => handleChange('compactMode', checked)}
              label="Compact mode"
              description="Reduce spacing and padding for a more dense layout"
            />

            <Checkbox
              checked={formData.showAnimations}
              onChange={(checked) => handleChange('showAnimations', checked)}
              label="Show animations"
              description="Enable smooth transitions and animations throughout the app"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h5 className="text-sm font-medium text-gray-900 mb-3">Preview</h5>
          <div 
            className="p-4 rounded-lg border-2"
            style={{ 
              borderColor: formData.primaryColor,
              fontFamily: formData.fontFamily,
              fontSize: formData.fontSize === 'small' ? '14px' : formData.fontSize === 'large' ? '18px' : '16px'
            }}
          >
            <div className="flex items-center space-x-3 mb-3">
              {logoPreview && (
                <img src={logoPreview} alt="Logo" className="w-8 h-8 object-contain" />
              )}
              <h6 className="font-semibold" style={{ color: formData.primaryColor }}>
                {formData.customBranding.companyName}
              </h6>
            </div>
            <p className="text-sm" style={{ color: formData.secondaryColor }}>
              This is how your customized interface will look with the selected settings.
            </p>
            <button
              className="mt-2 px-3 py-1 rounded text-white text-sm"
              style={{ backgroundColor: formData.primaryColor }}
            >
              Sample Button
            </button>
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

export default AppearanceSettings;