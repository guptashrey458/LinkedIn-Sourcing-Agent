import React, { useState } from 'react';
import { Card, CacheMonitor, Button, Loading } from '../../components/ui';
import { IntegrationDashboard } from '../../components/integrations';
import { 
  GeneralSettings,
  ApiSettings,
  NotificationSettings,
  SecuritySettings,
  AppearanceSettings,
  PerformanceSettings,
  UserPreferences
} from '../../components/settings';
import { useSettings } from '../../hooks/useSettings';
import { Settings as SettingsIcon, Link, Database, Bell, Shield, Palette, User } from 'lucide-react';

type SettingsTab = 'general' | 'api' | 'integrations' | 'notifications' | 'security' | 'appearance' | 'performance' | 'preferences';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const { 
    settings, 
    preferences, 
    isLoadingSettings, 
    isLoadingPreferences,
    settingsError,
    preferencesError 
  } = useSettings();

  const tabs = [
    { id: 'general' as const, label: 'General', icon: SettingsIcon },
    { id: 'api' as const, label: 'API', icon: Database },
    { id: 'integrations' as const, label: 'Integrations', icon: Link },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'performance' as const, label: 'Performance', icon: Database },
    { id: 'preferences' as const, label: 'Preferences', icon: User }
  ];

  const renderTabContent = () => {
    // Show loading state
    if (isLoadingSettings || isLoadingPreferences) {
      return (
        <Card className="p-6">
          <Loading size="lg" text="Loading settings..." />
        </Card>
      );
    }

    // Show error state
    if (settingsError || preferencesError) {
      return (
        <Card className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Settings</h3>
            <p className="text-red-600 mb-4">
              {settingsError?.message || preferencesError?.message || 'Failed to load settings'}
            </p>
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </Card>
      );
    }

    // Render settings content
    switch (activeTab) {
      case 'general':
        return settings ? <GeneralSettings settings={settings.general} /> : null;
      
      case 'api':
        return settings ? <ApiSettings settings={settings.api} /> : null;
      
      case 'integrations':
        return <IntegrationDashboard />;
      
      case 'notifications':
        return settings ? <NotificationSettings settings={settings.notifications} /> : null;
      
      case 'security':
        return settings ? <SecuritySettings settings={settings.security} /> : null;
      
      case 'appearance':
        return settings ? <AppearanceSettings settings={settings.appearance} /> : null;
      
      case 'performance':
        return (
          <div className="space-y-6">
            {settings ? <PerformanceSettings settings={settings.performance} /> : null}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cache Monitor</h3>
              <CacheMonitor showDetails={true} />
            </Card>
          </div>
        );
      
      case 'preferences':
        return preferences ? <UserPreferences preferences={preferences} /> : null;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <SettingsIcon className="w-8 h-8 mr-3 text-blue-600" />
            Settings
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your application settings, integrations, and preferences.
          </p>
        </div>

        <div className="flex space-x-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <Card className="p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab(tab.id)}
                      className="w-full justify-start"
                      icon={<Icon className="w-4 h-4" />}
                    >
                      {tab.label}
                    </Button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;