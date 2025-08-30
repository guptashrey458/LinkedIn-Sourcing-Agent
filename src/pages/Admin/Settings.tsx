import React, { useState } from 'react';
import { Settings, Users, Shield, Activity, Database, Bell, Mail, Lock } from 'lucide-react';
import { useAdminPermissions } from '../../hooks/usePermissions';
import { AdminOnly, PermissionGate } from '../../components/auth/RoleBasedRender';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { PERMISSIONS } from '../../utils/permissions';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  permission: string;
  component: React.ComponentType;
}

// General Settings Component
const GeneralSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    siteName: 'LinkedIn Sourcing Agent',
    siteDescription: 'AI-powered candidate sourcing platform',
    contactEmail: 'admin@company.com',
    timezone: 'UTC',
  });

  const handleSave = () => {
    // Implementation for saving general settings
    console.log('Saving general settings:', settings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
        <div className="grid grid-cols-1 gap-6">
          <Input
            label="Site Name"
            value={settings.siteName}
            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            placeholder="Enter site name"
          />
          <Input
            label="Site Description"
            value={settings.siteDescription}
            onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
            placeholder="Enter site description"
          />
          <Input
            label="Contact Email"
            type="email"
            value={settings.contactEmail}
            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
            placeholder="Enter contact email"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} variant="primary">
            Save General Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

// User Management Settings Component
const UserManagementSettings: React.FC = () => {
  const [userSettings, setUserSettings] = useState({
    allowSelfRegistration: false,
    requireEmailVerification: true,
    defaultRole: 'viewer' as const,
    sessionTimeout: 24,
  });

  const handleSave = () => {
    console.log('Saving user management settings:', userSettings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Allow Self Registration
              </label>
              <p className="text-sm text-gray-500">
                Allow users to register for accounts without admin approval
              </p>
            </div>
            <input
              type="checkbox"
              checked={userSettings.allowSelfRegistration}
              onChange={(e) => setUserSettings({ ...userSettings, allowSelfRegistration: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Require Email Verification
              </label>
              <p className="text-sm text-gray-500">
                Require users to verify their email address before accessing the system
              </p>
            </div>
            <input
              type="checkbox"
              checked={userSettings.requireEmailVerification}
              onChange={(e) => setUserSettings({ ...userSettings, requireEmailVerification: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Role for New Users
            </label>
            <select
              value={userSettings.defaultRole}
              onChange={(e) => setUserSettings({ ...userSettings, defaultRole: e.target.value as any })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="viewer">Viewer</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>

          <div>
            <Input
              label="Session Timeout (hours)"
              type="number"
              value={userSettings.sessionTimeout}
              onChange={(e) => setUserSettings({ ...userSettings, sessionTimeout: parseInt(e.target.value) })}
              placeholder="Enter session timeout in hours"
              min="1"
              max="168"
            />
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} variant="primary">
            Save User Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

// Security Settings Component
const SecuritySettings: React.FC = () => {
  const [securitySettings, setSecuritySettings] = useState({
    enforceStrongPasswords: true,
    enableTwoFactor: false,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
  });

  const handleSave = () => {
    console.log('Saving security settings:', securitySettings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enforce Strong Passwords
              </label>
              <p className="text-sm text-gray-500">
                Require passwords to meet complexity requirements
              </p>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.enforceStrongPasswords}
              onChange={(e) => setSecuritySettings({ ...securitySettings, enforceStrongPasswords: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable Two-Factor Authentication
              </label>
              <p className="text-sm text-gray-500">
                Require users to use two-factor authentication
              </p>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.enableTwoFactor}
              onChange={(e) => setSecuritySettings({ ...securitySettings, enableTwoFactor: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Login Attempts"
              type="number"
              value={securitySettings.maxLoginAttempts}
              onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
              placeholder="Enter max attempts"
              min="3"
              max="10"
            />
            <Input
              label="Lockout Duration (minutes)"
              type="number"
              value={securitySettings.lockoutDuration}
              onChange={(e) => setSecuritySettings({ ...securitySettings, lockoutDuration: parseInt(e.target.value) })}
              placeholder="Enter lockout duration"
              min="5"
              max="1440"
            />
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} variant="primary">
            Save Security Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

// System Settings Component
const SystemSettings: React.FC = () => {
  const [systemSettings, setSystemSettings] = useState({
    enableLogging: true,
    logLevel: 'info',
    enableMetrics: true,
    enableBackups: true,
    backupFrequency: 'daily',
  });

  const handleSave = () => {
    console.log('Saving system settings:', systemSettings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable System Logging
              </label>
              <p className="text-sm text-gray-500">
                Log system events and user actions
              </p>
            </div>
            <input
              type="checkbox"
              checked={systemSettings.enableLogging}
              onChange={(e) => setSystemSettings({ ...systemSettings, enableLogging: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Log Level
            </label>
            <select
              value={systemSettings.logLevel}
              onChange={(e) => setSystemSettings({ ...systemSettings, logLevel: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable Performance Metrics
              </label>
              <p className="text-sm text-gray-500">
                Collect and store performance metrics
              </p>
            </div>
            <input
              type="checkbox"
              checked={systemSettings.enableMetrics}
              onChange={(e) => setSystemSettings({ ...systemSettings, enableMetrics: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable Automatic Backups
              </label>
              <p className="text-sm text-gray-500">
                Automatically backup system data
              </p>
            </div>
            <input
              type="checkbox"
              checked={systemSettings.enableBackups}
              onChange={(e) => setSystemSettings({ ...systemSettings, enableBackups: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          {systemSettings.enableBackups && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Frequency
              </label>
              <select
                value={systemSettings.backupFrequency}
                onChange={(e) => setSystemSettings({ ...systemSettings, backupFrequency: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          )}
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} variant="primary">
            Save System Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main Admin Settings Component
const AdminSettings: React.FC = () => {
  const adminPermissions = useAdminPermissions();
  const [activeSection, setActiveSection] = useState('general');

  const settingsSections: SettingsSection[] = [
    {
      id: 'general',
      title: 'General',
      description: 'Basic application settings',
      icon: <Settings className="w-5 h-5" />,
      permission: PERMISSIONS.ADMIN_SETTINGS,
      component: GeneralSettings,
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'User registration and account settings',
      icon: <Users className="w-5 h-5" />,
      permission: PERMISSIONS.ADMIN_USERS,
      component: UserManagementSettings,
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Authentication and security policies',
      icon: <Shield className="w-5 h-5" />,
      permission: PERMISSIONS.ADMIN_SETTINGS,
      component: SecuritySettings,
    },
    {
      id: 'system',
      title: 'System',
      description: 'System configuration and maintenance',
      icon: <Database className="w-5 h-5" />,
      permission: PERMISSIONS.ADMIN_SYSTEM,
      component: SystemSettings,
    },
  ];

  const availableSections = settingsSections.filter(section => {
    switch (section.permission) {
      case PERMISSIONS.ADMIN_SETTINGS:
        return adminPermissions.canAccessSettings();
      case PERMISSIONS.ADMIN_USERS:
        return adminPermissions.canManageUsers();
      case PERMISSIONS.ADMIN_SYSTEM:
        return adminPermissions.canManageSystem();
      default:
        return false;
    }
  });

  const activeComponent = availableSections.find(section => section.id === activeSection)?.component;

  return (
    <AdminOnly fallback={
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have permission to access admin settings.
        </p>
      </div>
    }>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage system configuration and user settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Settings Navigation */}
          <div className="lg:w-1/4">
            <Card>
              <nav className="space-y-1">
                {availableSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{section.icon}</span>
                    <div className="text-left">
                      <div className="font-medium">{section.title}</div>
                      <div className="text-xs text-gray-500">{section.description}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:w-3/4">
            <Card>
              {activeComponent && React.createElement(activeComponent)}
            </Card>
          </div>
        </div>
      </div>
    </AdminOnly>
  );
};

export default AdminSettings;