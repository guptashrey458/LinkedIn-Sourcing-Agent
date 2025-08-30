import { 
  AppSettings, 
  UserPreferences, 
  SettingsValidationError, 
  SettingsUpdateRequest,
  GeneralSettings,
  ApiSettings,
  NotificationSettings,
  SecuritySettings,
  AppearanceSettings,
  PerformanceSettings
} from '../types';
import { api } from './api';

class SettingsService {
  private readonly STORAGE_KEY = 'app_settings';
  private readonly PREFERENCES_KEY = 'user_preferences';

  // Default settings
  private defaultSettings: AppSettings = {
    general: {
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h',
      defaultPageSize: 25,
      autoSave: true,
      confirmBeforeDelete: true,
    },
    api: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableCaching: true,
      cacheTimeout: 300000,
      endpoints: {
        candidates: '/api/candidates',
        jobs: '/api/jobs',
        pipelines: '/api/pipelines',
        messages: '/api/messages',
      },
      authentication: {
        type: 'bearer',
        credentials: {},
      },
    },
    notifications: {
      email: {
        enabled: true,
        pipelineComplete: true,
        pipelineError: true,
        newCandidates: false,
        messageResponses: true,
      },
      browser: {
        enabled: true,
        pipelineComplete: true,
        pipelineError: true,
        newCandidates: false,
        messageResponses: false,
      },
      sound: {
        enabled: false,
        volume: 0.5,
      },
    },
    security: {
      sessionTimeout: 3600000, // 1 hour
      requirePasswordChange: false,
      passwordChangeInterval: 90, // days
      twoFactorAuth: false,
      auditLogging: true,
      dataRetention: 365, // days
      anonymizeData: false,
    },
    appearance: {
      theme: 'system',
      primaryColor: '#3B82F6',
      secondaryColor: '#6B7280',
      fontFamily: 'Inter',
      fontSize: 'medium',
      compactMode: false,
      showAnimations: true,
      customBranding: {
        companyName: 'LinkedIn Sourcing Agent',
        primaryColor: '#3B82F6',
        secondaryColor: '#6B7280',
      },
    },
    performance: {
      enableVirtualScrolling: true,
      pageSize: 50,
      cacheSize: 100,
      preloadImages: true,
      enableServiceWorker: true,
      offlineMode: false,
      compressionLevel: 'medium',
    },
  };

  private defaultPreferences: UserPreferences = {
    userId: '',
    dashboard: {
      layout: 'grid',
      widgets: [
        {
          id: 'metrics',
          type: 'metrics',
          title: 'Key Metrics',
          position: { x: 0, y: 0, w: 12, h: 4 },
          visible: true,
          config: {},
        },
        {
          id: 'recent-activity',
          type: 'activity',
          title: 'Recent Activity',
          position: { x: 0, y: 4, w: 6, h: 6 },
          visible: true,
          config: {},
        },
        {
          id: 'pipeline-chart',
          type: 'chart',
          title: 'Pipeline Performance',
          position: { x: 6, y: 4, w: 6, h: 6 },
          visible: true,
          config: { chartType: 'line' },
        },
      ],
      refreshInterval: 30000,
    },
    candidates: {
      defaultView: 'grid',
      defaultSort: 'score',
      defaultFilters: {},
      columnsVisible: ['name', 'title', 'company', 'location', 'score', 'status'],
    },
    jobs: {
      defaultView: 'list',
      defaultSort: 'createdAt',
      defaultFilters: {},
      columnsVisible: ['title', 'company', 'location', 'status', 'createdAt'],
    },
    pipeline: {
      autoRefresh: true,
      refreshInterval: 5000,
      showDetails: true,
    },
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      fontSize: 'medium',
    },
  };

  // Get current settings
  async getSettings(): Promise<AppSettings> {
    try {
      // Try to get from server first
      const response = await api.get<AppSettings>('/api/settings');
      return response.data;
    } catch (error) {
      // Fallback to local storage
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return { ...this.defaultSettings, ...JSON.parse(stored) };
      }
      return this.defaultSettings;
    }
  }

  // Update settings
  async updateSettings(request: SettingsUpdateRequest): Promise<AppSettings> {
    const validation = this.validateSettings(request.section, request.settings);
    if (validation.length > 0) {
      throw new Error(`Validation failed: ${validation.map(e => e.message).join(', ')}`);
    }

    try {
      // Update on server
      const response = await api.patch<AppSettings>('/api/settings', request);
      
      // Update local storage as backup
      const currentSettings = await this.getSettings();
      const updatedSettings = {
        ...currentSettings,
        [request.section]: { ...currentSettings[request.section], ...request.settings }
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSettings));
      
      return response.data;
    } catch (error) {
      // Fallback to local storage only
      const currentSettings = await this.getSettings();
      const updatedSettings = {
        ...currentSettings,
        [request.section]: { ...currentSettings[request.section], ...request.settings }
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSettings));
      return updatedSettings;
    }
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const response = await api.get<UserPreferences>(`/api/users/${userId}/preferences`);
      return response.data;
    } catch (error) {
      const stored = localStorage.getItem(`${this.PREFERENCES_KEY}_${userId}`);
      if (stored) {
        return { ...this.defaultPreferences, ...JSON.parse(stored), userId };
      }
      return { ...this.defaultPreferences, userId };
    }
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const response = await api.patch<UserPreferences>(`/api/users/${userId}/preferences`, preferences);
      
      // Update local storage as backup
      localStorage.setItem(`${this.PREFERENCES_KEY}_${userId}`, JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      const current = await this.getUserPreferences(userId);
      const updated = { ...current, ...preferences };
      localStorage.setItem(`${this.PREFERENCES_KEY}_${userId}`, JSON.stringify(updated));
      return updated;
    }
  }

  // Validate settings
  private validateSettings(section: keyof AppSettings, settings: any): SettingsValidationError[] {
    const errors: SettingsValidationError[] = [];

    switch (section) {
      case 'general':
        this.validateGeneralSettings(settings as Partial<GeneralSettings>, errors);
        break;
      case 'api':
        this.validateApiSettings(settings as Partial<ApiSettings>, errors);
        break;
      case 'notifications':
        this.validateNotificationSettings(settings as Partial<NotificationSettings>, errors);
        break;
      case 'security':
        this.validateSecuritySettings(settings as Partial<SecuritySettings>, errors);
        break;
      case 'appearance':
        this.validateAppearanceSettings(settings as Partial<AppearanceSettings>, errors);
        break;
      case 'performance':
        this.validatePerformanceSettings(settings as Partial<PerformanceSettings>, errors);
        break;
    }

    return errors;
  }

  private validateGeneralSettings(settings: Partial<GeneralSettings>, errors: SettingsValidationError[]) {
    if (settings.defaultPageSize !== undefined) {
      if (settings.defaultPageSize < 10 || settings.defaultPageSize > 100) {
        errors.push({
          field: 'defaultPageSize',
          message: 'Page size must be between 10 and 100',
          code: 'INVALID_RANGE'
        });
      }
    }
  }

  private validateApiSettings(settings: Partial<ApiSettings>, errors: SettingsValidationError[]) {
    if (settings.baseUrl !== undefined) {
      try {
        new URL(settings.baseUrl);
      } catch {
        errors.push({
          field: 'baseUrl',
          message: 'Invalid URL format',
          code: 'INVALID_URL'
        });
      }
    }

    if (settings.timeout !== undefined) {
      if (settings.timeout < 1000 || settings.timeout > 300000) {
        errors.push({
          field: 'timeout',
          message: 'Timeout must be between 1 and 300 seconds',
          code: 'INVALID_RANGE'
        });
      }
    }

    if (settings.retryAttempts !== undefined) {
      if (settings.retryAttempts < 0 || settings.retryAttempts > 10) {
        errors.push({
          field: 'retryAttempts',
          message: 'Retry attempts must be between 0 and 10',
          code: 'INVALID_RANGE'
        });
      }
    }
  }

  private validateNotificationSettings(settings: Partial<NotificationSettings>, errors: SettingsValidationError[]) {
    if (settings.sound?.volume !== undefined) {
      if (settings.sound.volume < 0 || settings.sound.volume > 1) {
        errors.push({
          field: 'sound.volume',
          message: 'Volume must be between 0 and 1',
          code: 'INVALID_RANGE'
        });
      }
    }
  }

  private validateSecuritySettings(settings: Partial<SecuritySettings>, errors: SettingsValidationError[]) {
    if (settings.sessionTimeout !== undefined) {
      if (settings.sessionTimeout < 300000 || settings.sessionTimeout > 86400000) {
        errors.push({
          field: 'sessionTimeout',
          message: 'Session timeout must be between 5 minutes and 24 hours',
          code: 'INVALID_RANGE'
        });
      }
    }

    if (settings.dataRetention !== undefined) {
      if (settings.dataRetention < 30 || settings.dataRetention > 2555) {
        errors.push({
          field: 'dataRetention',
          message: 'Data retention must be between 30 and 2555 days',
          code: 'INVALID_RANGE'
        });
      }
    }
  }

  private validateAppearanceSettings(settings: Partial<AppearanceSettings>, errors: SettingsValidationError[]) {
    if (settings.primaryColor !== undefined) {
      if (!/^#[0-9A-F]{6}$/i.test(settings.primaryColor)) {
        errors.push({
          field: 'primaryColor',
          message: 'Invalid color format. Use hex format (#RRGGBB)',
          code: 'INVALID_FORMAT'
        });
      }
    }

    if (settings.secondaryColor !== undefined) {
      if (!/^#[0-9A-F]{6}$/i.test(settings.secondaryColor)) {
        errors.push({
          field: 'secondaryColor',
          message: 'Invalid color format. Use hex format (#RRGGBB)',
          code: 'INVALID_FORMAT'
        });
      }
    }
  }

  private validatePerformanceSettings(settings: Partial<PerformanceSettings>, errors: SettingsValidationError[]) {
    if (settings.pageSize !== undefined) {
      if (settings.pageSize < 10 || settings.pageSize > 1000) {
        errors.push({
          field: 'pageSize',
          message: 'Page size must be between 10 and 1000',
          code: 'INVALID_RANGE'
        });
      }
    }

    if (settings.cacheSize !== undefined) {
      if (settings.cacheSize < 10 || settings.cacheSize > 1000) {
        errors.push({
          field: 'cacheSize',
          message: 'Cache size must be between 10 and 1000',
          code: 'INVALID_RANGE'
        });
      }
    }
  }

  // Test API connection
  async testApiConnection(baseUrl: string, timeout: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Reset settings to defaults
  async resetSettings(): Promise<AppSettings> {
    localStorage.removeItem(this.STORAGE_KEY);
    try {
      await api.delete('/api/settings');
    } catch (error) {
      // Ignore server errors for reset
    }
    return this.defaultSettings;
  }

  // Export settings
  exportSettings(): string {
    const settings = localStorage.getItem(this.STORAGE_KEY);
    return settings || JSON.stringify(this.defaultSettings);
  }

  // Import settings
  async importSettings(settingsJson: string): Promise<AppSettings> {
    try {
      const settings = JSON.parse(settingsJson) as AppSettings;
      
      // Validate all sections
      const allErrors: SettingsValidationError[] = [];
      Object.keys(settings).forEach(section => {
        const sectionErrors = this.validateSettings(section as keyof AppSettings, settings[section as keyof AppSettings]);
        allErrors.push(...sectionErrors);
      });

      if (allErrors.length > 0) {
        throw new Error(`Invalid settings: ${allErrors.map(e => e.message).join(', ')}`);
      }

      localStorage.setItem(this.STORAGE_KEY, settingsJson);
      
      try {
        await api.put('/api/settings', settings);
      } catch (error) {
        // Continue with local storage if server fails
      }

      return settings;
    } catch (error) {
      throw new Error('Invalid settings format');
    }
  }
}

export const settingsService = new SettingsService();