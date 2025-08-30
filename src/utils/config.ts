import type { AppConfig } from '../types';

// Environment variable helper
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  return value || defaultValue || '';
};

// Boolean environment variable helper
const getBooleanEnvVar = (key: string, defaultValue = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

// Application configuration
export const config: AppConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'https://linkedin-sourcing-agent.onrender.com'),
  wsUrl: getEnvVar('VITE_WS_URL', 'wss://linkedin-sourcing-agent.onrender.com/ws'),
  environment: getEnvVar('VITE_ENVIRONMENT', 'development') as 'development' | 'staging' | 'production',
  features: {
    realTimeUpdates: getBooleanEnvVar('VITE_ENABLE_REAL_TIME', true),
    analytics: getBooleanEnvVar('VITE_ENABLE_ANALYTICS', false),
    debug: getBooleanEnvVar('VITE_ENABLE_DEBUG', false),
  },
  monitoring: {
    sentryDsn: getEnvVar('VITE_SENTRY_DSN', ''),
    googleAnalyticsId: getEnvVar('VITE_GOOGLE_ANALYTICS_ID', ''),
  },
};

// Validate configuration
export const validateConfig = (): void => {
  const requiredFields = ['apiBaseUrl', 'wsUrl', 'environment'];
  
  for (const field of requiredFields) {
    if (!config[field as keyof AppConfig]) {
      throw new Error(`Configuration field '${field}' is required`);
    }
  }

  // Validate URLs
  try {
    new URL(config.apiBaseUrl);
  } catch {
    throw new Error('Invalid API base URL');
  }

  // Validate environment
  const validEnvironments = ['development', 'staging', 'production'];
  if (!validEnvironments.includes(config.environment)) {
    throw new Error(`Invalid environment: ${config.environment}`);
  }
};

// Development helpers
export const isDevelopment = config.environment === 'development';
export const isProduction = config.environment === 'production';
export const isStaging = config.environment === 'staging';

// Feature flag helpers
export const isFeatureEnabled = (feature: keyof typeof config.features): boolean => {
  return config.features[feature];
};

// API URL builder
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = config.apiBaseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// WebSocket URL builder
export const buildWsUrl = (endpoint?: string): string => {
  const baseUrl = config.wsUrl.replace(/\/$/, '');
  if (!endpoint) return baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Export configuration for debugging
if (isDevelopment && config.features.debug) {
  console.log('Application Configuration:', config);
}