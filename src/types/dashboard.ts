// Dashboard-specific types
export interface DashboardMetrics {
  totalCandidates: number;
  totalJobs: number;
  activePipelines: number;
  successRate: number;
  averageScore: number;
  candidatesThisWeek: number;
  candidatesThisMonth: number;
  topPerformingJob?: {
    id: string;
    title: string;
    candidatesFound: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'pipeline_started' | 'pipeline_completed' | 'pipeline_failed' | 'candidate_added' | 'job_created';
  title: string;
  description: string;
  timestamp: Date;
  status?: 'success' | 'error' | 'warning' | 'info';
  metadata?: {
    jobId?: string;
    pipelineId?: string;
    candidateId?: string;
    candidatesFound?: number;
  };
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

export interface ActivityFilters {
  type?: RecentActivity['type'][];
  dateRange?: [Date, Date];
  status?: RecentActivity['status'][];
}