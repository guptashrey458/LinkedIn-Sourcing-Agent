// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  JOBS: {
    LIST: '/jobs',
    CREATE: '/jobs',
    UPDATE: (id: string) => `/jobs/${id}`,
    DELETE: (id: string) => `/jobs/${id}`,
    TEMPLATES: '/jobs/templates',
  },
  CANDIDATES: {
    LIST: '/candidates',
    DETAIL: (id: string) => `/candidates/${id}`,
    EXPORT: '/candidates/export',
    BULK_UPDATE: '/candidates/bulk-update',
  },
  PIPELINE: {
    START: '/pipeline/start',
    STATUS: (id: string) => `/pipeline/${id}/status`,
    HISTORY: '/pipeline/history',
    CANCEL: (id: string) => `/pipeline/${id}/cancel`,
  },
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    CANDIDATES: '/analytics/candidates',
    PIPELINE: '/analytics/pipeline',
  },
} as const;

// Application routes
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  JOBS: '/jobs',
  JOB_CREATE: '/jobs/create',
  JOB_EDIT: (id: string) => `/jobs/${id}/edit`,
  CANDIDATES: '/candidates',
  CANDIDATE_DETAIL: (id: string) => `/candidates/${id}`,
  PIPELINE: '/pipeline',
  PIPELINE_DETAIL: (id: string) => `/pipeline/${id}`,
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  LOGIN: '/login',
  PROFILE: '/profile',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'linkedin-sourcing-auth-token',
  REFRESH_TOKEN: 'linkedin-sourcing-refresh-token',
  USER_PREFERENCES: 'linkedin-sourcing-user-preferences',
  THEME: 'linkedin-sourcing-theme',
  SIDEBAR_STATE: 'linkedin-sourcing-sidebar-state',
  FILTERS: 'linkedin-sourcing-filters',
} as const;

// Query keys for React Query
export const QUERY_KEYS = {
  AUTH: ['auth'],
  USER: ['user'],
  JOBS: ['jobs'],
  JOB_DETAIL: (id: string) => ['jobs', id],
  JOB_TEMPLATES: ['job-templates'],
  CANDIDATES: ['candidates'],
  CANDIDATE_DETAIL: (id: string) => ['candidates', id],
  PIPELINE: ['pipeline'],
  PIPELINE_DETAIL: (id: string) => ['pipeline', id],
  PIPELINE_HISTORY: ['pipeline', 'history'],
  ANALYTICS: ['analytics'],
  DASHBOARD_METRICS: ['analytics', 'dashboard'],
} as const;

// Default values
export const DEFAULT_VALUES = {
  PAGINATION: {
    PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
  FILTERS: {
    SCORE_RANGE: [0, 10] as [number, number],
    EXPERIENCE_RANGE: [0, 20] as [number, number],
  },
  DEBOUNCE_DELAY: 300,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Pipeline stages
export const PIPELINE_STAGES = {
  DISCOVERY: 'discovery',
  ENRICHMENT: 'enrichment',
  SCORING: 'scoring',
  MESSAGING: 'messaging',
} as const;

// Status options
export const CANDIDATE_STATUSES = [
  { value: 'new', label: 'New', color: 'gray' },
  { value: 'contacted', label: 'Contacted', color: 'blue' },
  { value: 'responded', label: 'Responded', color: 'green' },
  { value: 'interested', label: 'Interested', color: 'purple' },
  { value: 'not_interested', label: 'Not Interested', color: 'red' },
] as const;

export const JOB_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'paused', label: 'Paused', color: 'yellow' },
  { value: 'completed', label: 'Completed', color: 'blue' },
] as const;

export const PIPELINE_STATUSES = [
  { value: 'running', label: 'Running', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'failed', label: 'Failed', color: 'red' },
  { value: 'cancelled', label: 'Cancelled', color: 'gray' },
] as const;

// Theme configuration
export const THEME_CONFIG = {
  COLORS: {
    PRIMARY: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    GRAY: {
      50: '#f9fafb',
      100: '#f3f4f6',
      500: '#6b7280',
      700: '#374151',
      900: '#111827',
    },
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px',
  },
} as const;

// Validation rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  JOB_TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  COMPANY_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  SKILLS: {
    MAX_COUNT: 20,
    MAX_LENGTH: 50,
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Please contact your administrator.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  VALIDATION: 'Please check your input and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  JOB_CREATED: 'Job created successfully!',
  JOB_UPDATED: 'Job updated successfully!',
  JOB_DELETED: 'Job deleted successfully!',
  CANDIDATE_UPDATED: 'Candidate updated successfully!',
  PIPELINE_STARTED: 'Pipeline started successfully!',
  EXPORT_COMPLETED: 'Export completed successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;

// Feature flags
export const FEATURES = {
  REAL_TIME_UPDATES: 'realTimeUpdates',
  ANALYTICS: 'analytics',
  DEBUG: 'debug',
  BULK_OPERATIONS: 'bulkOperations',
  EXPORT: 'export',
  TEMPLATES: 'templates',
} as const;