import React from 'react';
import { Card, Button, Checkbox } from '../ui';
import { NotificationSettings as NotificationSettingsType } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import { Save, RotateCcw, Mail, Bell, Volume2, VolumeX } from 'lucide-react';

interface NotificationSettingsProps {
  settings: NotificationSettingsType;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ settings }) => {
  const { updateSettings, isUpdatingSettings } = useSettings();
  const [formData, setFormData] = React.useState(settings);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    setFormData(settings);
    setHasChanges(false);
  }, [settings]);

  const handleChange = (section: 'email' | 'browser' | 'sound', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings('notifications', formData);
    setHasChanges(false);
  };

  const handleReset = () => {
    setFormData(settings);
    setHasChanges(false);
  };

  const testNotification = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Test Notification', {
          body: 'This is a test notification from LinkedIn Sourcing Agent',
          icon: '/favicon.ico'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Test Notification', {
              body: 'This is a test notification from LinkedIn Sourcing Agent',
              icon: '/favicon.ico'
            });
          }
        });
      }
    }
  };

  const testSound = () => {
    if (formData.sound.enabled) {
      const audio = new Audio('/notification.mp3');
      audio.volume = formData.sound.volume;
      audio.play().catch(() => {
        // Fallback to system beep
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = 800;
        gainNode.gain.value = formData.sound.volume * 0.1;
        
        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
          <p className="text-sm text-gray-600">Configure how you receive notifications</p>
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
        {/* Email Notifications */}
        <div>
          <div className="flex items-center mb-4">
            <Mail className="w-5 h-5 text-gray-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">Email Notifications</h4>
          </div>
          
          <div className="space-y-3 ml-7">
            <Checkbox
              checked={formData.email.enabled}
              onChange={(checked) => handleChange('email', 'enabled', checked)}
              label="Enable email notifications"
              description="Receive notifications via email"
            />
            
            <div className="ml-6 space-y-2">
              <Checkbox
                checked={formData.email.pipelineComplete}
                onChange={(checked) => handleChange('email', 'pipelineComplete', checked)}
                disabled={!formData.email.enabled}
                label="Pipeline completion"
                description="When a sourcing pipeline completes successfully"
              />
              
              <Checkbox
                checked={formData.email.pipelineError}
                onChange={(checked) => handleChange('email', 'pipelineError', checked)}
                disabled={!formData.email.enabled}
                label="Pipeline errors"
                description="When a sourcing pipeline encounters errors"
              />
              
              <Checkbox
                checked={formData.email.newCandidates}
                onChange={(checked) => handleChange('email', 'newCandidates', checked)}
                disabled={!formData.email.enabled}
                label="New candidates found"
                description="When new candidates are discovered"
              />
              
              <Checkbox
                checked={formData.email.messageResponses}
                onChange={(checked) => handleChange('email', 'messageResponses', checked)}
                disabled={!formData.email.enabled}
                label="Message responses"
                description="When candidates respond to messages"
              />
            </div>
          </div>
        </div>

        {/* Browser Notifications */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-gray-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">Browser Notifications</h4>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={testNotification}
              disabled={!formData.browser.enabled}
            >
              Test Notification
            </Button>
          </div>
          
          <div className="space-y-3 ml-7">
            <Checkbox
              checked={formData.browser.enabled}
              onChange={(checked) => handleChange('browser', 'enabled', checked)}
              label="Enable browser notifications"
              description="Show desktop notifications in your browser"
            />
            
            <div className="ml-6 space-y-2">
              <Checkbox
                checked={formData.browser.pipelineComplete}
                onChange={(checked) => handleChange('browser', 'pipelineComplete', checked)}
                disabled={!formData.browser.enabled}
                label="Pipeline completion"
                description="When a sourcing pipeline completes successfully"
              />
              
              <Checkbox
                checked={formData.browser.pipelineError}
                onChange={(checked) => handleChange('browser', 'pipelineError', checked)}
                disabled={!formData.browser.enabled}
                label="Pipeline errors"
                description="When a sourcing pipeline encounters errors"
              />
              
              <Checkbox
                checked={formData.browser.newCandidates}
                onChange={(checked) => handleChange('browser', 'newCandidates', checked)}
                disabled={!formData.browser.enabled}
                label="New candidates found"
                description="When new candidates are discovered"
              />
              
              <Checkbox
                checked={formData.browser.messageResponses}
                onChange={(checked) => handleChange('browser', 'messageResponses', checked)}
                disabled={!formData.browser.enabled}
                label="Message responses"
                description="When candidates respond to messages"
              />
            </div>
          </div>
        </div>

        {/* Sound Notifications */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {formData.sound.enabled ? (
                <Volume2 className="w-5 h-5 text-gray-600 mr-2" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-600 mr-2" />
              )}
              <h4 className="text-md font-medium text-gray-900">Sound Notifications</h4>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={testSound}
              disabled={!formData.sound.enabled}
            >
              Test Sound
            </Button>
          </div>
          
          <div className="space-y-4 ml-7">
            <Checkbox
              checked={formData.sound.enabled}
              onChange={(checked) => handleChange('sound', 'enabled', checked)}
              label="Enable sound notifications"
              description="Play sounds for important notifications"
            />
            
            {formData.sound.enabled && (
              <div className="ml-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume: {Math.round(formData.sound.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.sound.volume}
                  onChange={(e) => handleChange('sound', 'volume', Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Notification Permissions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="text-sm font-medium text-blue-900 mb-2">Browser Permission Status</h5>
          <div className="text-sm text-blue-700">
            {typeof window !== 'undefined' && 'Notification' in window ? (
              <>
                <p>Notification permission: <strong>{Notification.permission}</strong></p>
                {Notification.permission === 'denied' && (
                  <p className="mt-1">
                    Browser notifications are blocked. Please enable them in your browser settings 
                    to receive desktop notifications.
                  </p>
                )}
                {Notification.permission === 'default' && (
                  <p className="mt-1">
                    Click "Test Notification" to grant permission for browser notifications.
                  </p>
                )}
              </>
            ) : (
              <p>Browser notifications are not supported in this environment.</p>
            )}
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

export default NotificationSettings;