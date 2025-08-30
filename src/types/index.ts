// Core application types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'recruiter' | 'viewer';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location: string;
  skills: string[];
  remote: boolean;
  salaryRange: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'paused' | 'completed';
}

export interface JobTemplate {
  id: string;
  name: string;
  description: string;
  template: Partial<JobDescription>;
  tags: string[];
  createdAt: Date;
}

export interface Candidate {
  id: string;
  name: string;
  email?: string;
  linkedinUrl: string;
  profilePicture?: string;
  title: string;
  company: string;
  location: string;
  skills: string[];
  experience: number;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  summary: string;
  education: Education[];
  workHistory: WorkExperience[];
  createdAt: Date;
  updatedAt: Date;
  status: 'new' | 'contacted' | 'responded' | 'interested' | 'not_interested';
  tags: string[];
}

export interface ScoreBreakdown {
  skillsMatch: number;
  experienceMatch: number;
  locationMatch: number;
  overallFit: number;
  details: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
}

export interface WorkExperience {
  company: string;
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location: string;
}

export interface PipelineRun {
  id: string;
  jobId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentStage: PipelineStage;
  stages: PipelineStageResult[];
  candidatesFound: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  errors: PipelineError[];
}

export interface PipelineStage {
  name: 'discovery' | 'enrichment' | 'scoring' | 'messaging';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  startTime?: Date;
  endTime?: Date;
}

export interface PipelineStageResult extends PipelineStage {
  result?: any;
  metrics?: Record<string, number>;
}

export interface PipelineError {
  stage: string;
  message: string;
  details?: string;
  timestamp: Date;
  recoverable: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PipelineResponse {
  job: JobDescription;
  candidates: Candidate[];
  topCandidate?: Candidate;
  message?: string;
  errors: string[];
  warnings: string[];
  pipelineRun: PipelineRun;
}

// UI State types
export interface UIState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  notifications: Notification[];
  loading: Record<string, boolean>;
  errors: Record<string, string>;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Filter types
export interface CandidateFilters {
  search?: string;
  scoreRange?: [number, number];
  location?: string[];
  skills?: string[];
  experience?: [number, number];
  status?: Candidate['status'][];
}

export interface JobFilters {
  search?: string;
  status?: JobDescription['status'][];
  location?: string[];
  skills?: string[];
  dateRange?: [Date, Date];
}

export interface PipelineFilters {
  status?: PipelineRun['status'][];
  dateRange?: [Date, Date];
  jobId?: string;
}

// Configuration types
export interface AppConfig {
  apiBaseUrl: string;
  wsUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: FeatureFlags;
  monitoring: MonitoringConfig;
}

export interface FeatureFlags {
  realTimeUpdates: boolean;
  analytics: boolean;
  debug: boolean;
}

export interface MonitoringConfig {
  sentryDsn?: string;
  googleAnalyticsId?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface JobForm extends Omit<JobDescription, 'id' | 'createdAt' | 'updatedAt'> {}

// Component prop types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  title?: string;
}

export interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export interface TagProps {
  variant?: 'default' | 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink';
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  children: React.ReactNode;
}

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
  text?: string;
}

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: 'pulse' | 'wave' | 'none';
}

// Messaging types
export interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: MessageVariable[];
  category: 'outreach' | 'follow_up' | 'interview' | 'rejection' | 'custom';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isDefault: boolean;
}

export interface MessageVariable {
  name: string;
  label: string;
  type: 'text' | 'candidate_field' | 'job_field' | 'custom';
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface Message {
  id: string;
  candidateId: string;
  jobId?: string;
  templateId?: string;
  subject: string;
  content: string;
  status: 'draft' | 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata?: Record<string, any>;
}

export interface MessageHistory {
  candidateId: string;
  messages: Message[];
  totalSent: number;
  totalOpened: number;
  totalReplied: number;
  lastContactDate?: Date;
  responseRate: number;
}

export interface BulkMessageRequest {
  candidateIds: string[];
  templateId: string;
  customizations: Record<string, Record<string, string>>; // candidateId -> variable -> value
  scheduledAt?: Date;
  jobId?: string;
}

export interface MessageAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalReplied: number;
  deliveryRate: number;
  openRate: number;
  responseRate: number;
  bounceRate: number;
  timeSeriesData: {
    date: string;
    sent: number;
    opened: number;
    replied: number;
  }[];
  templatePerformance: {
    templateId: string;
    templateName: string;
    sent: number;
    openRate: number;
    responseRate: number;
  }[];
}

// Dashboard types
export * from './dashboard';

// Export types
export interface ExportConfig {
  format: 'csv' | 'excel' | 'json';
  fields: ExportField[];
  filters?: Record<string, any>;
  filename?: string;
  includeHeaders?: boolean;
}

export interface ExportField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  selected: boolean;
  nested?: ExportField[];
}

export interface ExportProgress {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total: number;
  processed: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  downloadUrl?: string;
}

export interface ExportRequest {
  type: 'candidates' | 'jobs' | 'pipelines' | 'messages';
  config: ExportConfig;
  filters?: Record<string, any>;
}

// Integration types
export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'webhook' | 'api' | 'database' | 'file';
  enabled: boolean;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastSync?: Date;
  status: 'active' | 'inactive' | 'error';
}

export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers: Record<string, string>;
  authentication?: {
    type: 'bearer' | 'basic' | 'api_key';
    credentials: Record<string, string>;
  };
  events: string[];
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffTime: number;
  };
}

export interface ApiIntegrationConfig {
  baseUrl: string;
  authentication: {
    type: 'bearer' | 'basic' | 'api_key' | 'oauth2';
    credentials: Record<string, string>;
  };
  endpoints: {
    candidates?: string;
    jobs?: string;
    pipelines?: string;
  };
  mapping: Record<string, string>;
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  type: 'sync' | 'webhook' | 'export' | 'import';
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  duration?: number;
}

// Settings types
export interface AppSettings {
  general: GeneralSettings;
  api: ApiSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  appearance: AppearanceSettings;
  performance: PerformanceSettings;
}

export interface GeneralSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  defaultPageSize: number;
  autoSave: boolean;
  confirmBeforeDelete: boolean;
}

export interface ApiSettings {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableCaching: boolean;
  cacheTimeout: number;
  endpoints: {
    candidates: string;
    jobs: string;
    pipelines: string;
    messages: string;
  };
  authentication: {
    type: 'bearer' | 'api_key' | 'basic';
    credentials: Record<string, string>;
  };
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
    pipelineComplete: boolean;
    pipelineError: boolean;
    newCandidates: boolean;
    messageResponses: boolean;
  };
  browser: {
    enabled: boolean;
    pipelineComplete: boolean;
    pipelineError: boolean;
    newCandidates: boolean;
    messageResponses: boolean;
  };
  sound: {
    enabled: boolean;
    volume: number;
  };
}

export interface SecuritySettings {
  sessionTimeout: number;
  requirePasswordChange: boolean;
  passwordChangeInterval: number;
  twoFactorAuth: boolean;
  auditLogging: boolean;
  dataRetention: number;
  anonymizeData: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  showAnimations: boolean;
  customLogo?: string;
  customBranding: {
    companyName: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
  };
}

export interface PerformanceSettings {
  enableVirtualScrolling: boolean;
  pageSize: number;
  cacheSize: number;
  preloadImages: boolean;
  enableServiceWorker: boolean;
  offlineMode: boolean;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface UserPreferences {
  userId: string;
  dashboard: {
    layout: 'grid' | 'list';
    widgets: DashboardWidget[];
    refreshInterval: number;
  };
  candidates: {
    defaultView: 'grid' | 'list' | 'table';
    defaultSort: string;
    defaultFilters: CandidateFilters;
    columnsVisible: string[];
  };
  jobs: {
    defaultView: 'grid' | 'list' | 'table';
    defaultSort: string;
    defaultFilters: JobFilters;
    columnsVisible: string[];
  };
  pipeline: {
    autoRefresh: boolean;
    refreshInterval: number;
    showDetails: boolean;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  };
}

export interface DashboardWidget {
  id: string;
  type: 'metrics' | 'chart' | 'activity' | 'quick-actions';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  visible: boolean;
  config: Record<string, any>;
}

export interface SettingsValidationError {
  field: string;
  message: string;
  code: string;
}

export interface SettingsUpdateRequest {
  section: keyof AppSettings;
  settings: Partial<AppSettings[keyof AppSettings]>;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;