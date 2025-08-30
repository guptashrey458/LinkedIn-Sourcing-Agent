import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AppSettings, 
  UserPreferences, 
  SettingsUpdateRequest,
  SettingsValidationError 
} from '../types';
import { settingsService } from '../services/settingsService';
import { useAuth } from './useAuth';

export const useSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [validationErrors, setValidationErrors] = useState<SettingsValidationError[]>([]);

  // Get settings query
  const {
    data: settings,
    isLoading: isLoadingSettings,
    error: settingsError,
    refetch: refetchSettings
  } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get user preferences query
  const {
    data: preferences,
    isLoading: isLoadingPreferences,
    error: preferencesError,
    refetch: refetchPreferences
  } = useQuery({
    queryKey: ['preferences', user?.id],
    queryFn: () => user ? settingsService.getUserPreferences(user.id) : null,
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (request: SettingsUpdateRequest) => settingsService.updateSettings(request),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
      setValidationErrors([]);
    },
    onError: (error: Error) => {
      console.error('Failed to update settings:', error);
      // Try to extract validation errors from error message
      if (error.message.includes('Validation failed:')) {
        const errorMessage = error.message.replace('Validation failed: ', '');
        setValidationErrors([{
          field: 'general',
          message: errorMessage,
          code: 'VALIDATION_ERROR'
        }]);
      }
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (preferences: Partial<UserPreferences>) => 
      user ? settingsService.updateUserPreferences(user.id, preferences) : Promise.reject('No user'),
    onSuccess: (data) => {
      queryClient.setQueryData(['preferences', user?.id], data);
    },
    onError: (error) => {
      console.error('Failed to update preferences:', error);
    },
  });

  // Test API connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: ({ baseUrl, timeout }: { baseUrl: string; timeout?: number }) =>
      settingsService.testApiConnection(baseUrl, timeout),
  });

  // Reset settings mutation
  const resetSettingsMutation = useMutation({
    mutationFn: () => settingsService.resetSettings(),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
      setValidationErrors([]);
    },
  });

  // Helper functions
  const updateSettings = useCallback((section: keyof AppSettings, sectionSettings: any) => {
    updateSettingsMutation.mutate({ section, settings: sectionSettings });
  }, [updateSettingsMutation]);

  const updatePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    updatePreferencesMutation.mutate(newPreferences);
  }, [updatePreferencesMutation]);

  const testApiConnection = useCallback((baseUrl: string, timeout?: number) => {
    return testConnectionMutation.mutateAsync({ baseUrl, timeout });
  }, [testConnectionMutation]);

  const resetSettings = useCallback(() => {
    resetSettingsMutation.mutate();
  }, [resetSettingsMutation]);

  const exportSettings = useCallback(() => {
    return settingsService.exportSettings();
  }, []);

  const importSettings = useCallback(async (settingsJson: string) => {
    try {
      const importedSettings = await settingsService.importSettings(settingsJson);
      queryClient.setQueryData(['settings'], importedSettings);
      setValidationErrors([]);
      return importedSettings;
    } catch (error) {
      throw error;
    }
  }, [queryClient]);

  // Apply theme changes to document
  useEffect(() => {
    if (settings?.appearance) {
      const { theme, primaryColor, secondaryColor, fontFamily, fontSize } = settings.appearance;
      
      // Apply theme
      const root = document.documentElement;
      
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Apply custom colors
      root.style.setProperty('--color-primary', primaryColor);
      root.style.setProperty('--color-secondary', secondaryColor);

      // Apply font settings
      root.style.setProperty('--font-family', fontFamily);
      
      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px'
      };
      root.style.setProperty('--font-size-base', fontSizeMap[fontSize]);
    }
  }, [settings?.appearance]);

  // Apply accessibility settings
  useEffect(() => {
    if (preferences?.accessibility) {
      const { reducedMotion, highContrast } = preferences.accessibility;
      const root = document.documentElement;

      if (reducedMotion) {
        root.classList.add('reduce-motion');
      } else {
        root.classList.remove('reduce-motion');
      }

      if (highContrast) {
        root.classList.add('high-contrast');
      } else {
        root.classList.remove('high-contrast');
      }
    }
  }, [preferences?.accessibility]);

  return {
    // Data
    settings,
    preferences,
    validationErrors,

    // Loading states
    isLoadingSettings,
    isLoadingPreferences,
    isUpdatingSettings: updateSettingsMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    isTestingConnection: testConnectionMutation.isPending,
    isResetting: resetSettingsMutation.isPending,

    // Errors
    settingsError,
    preferencesError,
    updateError: updateSettingsMutation.error,
    preferencesUpdateError: updatePreferencesMutation.error,

    // Actions
    updateSettings,
    updatePreferences,
    testApiConnection,
    resetSettings,
    exportSettings,
    importSettings,
    refetchSettings,
    refetchPreferences,

    // Mutation results
    connectionTestResult: testConnectionMutation.data,
  };
};