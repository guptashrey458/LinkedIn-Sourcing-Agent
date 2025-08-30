import { api } from './api';
import type { JobDescription, Candidate, PipelineRun } from '../types';

// CrewAI specific types
export interface CrewAIJobRequest {
  job_id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location?: string;
  skills?: string[];
  remote?: boolean;
  salary_range?: string;
}

export interface CrewAIResponse {
  job: CrewAIJobRequest;
  candidates: CrewAICandidate[];
  top_candidate?: CrewAICandidate;
  message?: string;
  errors?: string[];
  warnings?: string[];
  pipeline_id?: string;
  status?: 'running' | 'completed' | 'failed';
  stages?: CrewAIStage[];
}

export interface CrewAICandidate {
  name: string;
  linkedin_url: string;
  title?: string;
  company?: string;
  location?: string;
  experience?: string;
  skills?: string[];
  score?: number;
  match_reasons?: string[];
  contact_info?: {
    email?: string;
    phone?: string;
  };
  summary?: string;
}

export interface CrewAIStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  duration?: number;
  message?: string;
  error?: string;
}

// Transform JobDescription to CrewAI format
const transformJobToCrewAI = (job: JobDescription): CrewAIJobRequest => ({
  job_id: job.id,
  title: job.title,
  company: job.company,
  description: job.description,
  requirements: job.requirements || [],
  location: job.location,
  skills: job.skills || [],
  remote: job.remote || false,
  salary_range: job.salaryRange,
});

// Transform CrewAI candidate to our format
const transformCrewAICandidate = (candidate: CrewAICandidate): Candidate => ({
  id: `crewai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: candidate.name,
  email: candidate.contact_info?.email || '',
  phone: candidate.contact_info?.phone || '',
  linkedinUrl: candidate.linkedin_url,
  title: candidate.title || '',
  company: candidate.company || '',
  location: candidate.location || '',
  experience: candidate.experience || '',
  skills: candidate.skills || [],
  score: candidate.score || 0,
  status: 'new',
  notes: candidate.summary || '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  matchReasons: candidate.match_reasons || [],
});

export const crewaiService = {
  // Process job with CrewAI
  processJob: async (job: JobDescription): Promise<{
    candidates: Candidate[];
    topCandidate?: Candidate;
    message?: string;
    pipelineRun: PipelineRun;
  }> => {
    try {
      const crewaiJob = transformJobToCrewAI(job);
      
      const response = await api.post<CrewAIResponse>('/process_job_crewai', crewaiJob);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to process job with CrewAI');
      }

      const data = response.data;
      
      // Transform candidates
      const candidates = data.candidates.map(transformCrewAICandidate);
      const topCandidate = data.top_candidate ? transformCrewAICandidate(data.top_candidate) : undefined;

      // Create pipeline run record
      const pipelineRun: PipelineRun = {
        id: data.pipeline_id || `pipeline-${Date.now()}`,
        jobId: job.id,
        status: data.status || 'completed',
        startedAt: new Date().toISOString(),
        completedAt: data.status === 'completed' ? new Date().toISOString() : undefined,
        candidatesFound: candidates.length,
        stages: data.stages?.map(stage => ({
          id: `stage-${stage.name}`,
          name: stage.name,
          status: stage.status,
          startedAt: stage.started_at,
          completedAt: stage.completed_at,
          duration: stage.duration,
          message: stage.message,
          error: stage.error,
        })) || [],
        errors: data.errors || [],
        warnings: data.warnings || [],
        metadata: {
          crewai: true,
          version: '1.0.0',
        },
      };

      return {
        candidates,
        topCandidate,
        message: data.message,
        pipelineRun,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to process job with CrewAI');
    }
  },

  // Health check for CrewAI service
  healthCheck: async (): Promise<{ status: string; pipeline: string }> => {
    try {
      const response = await api.get<{ status: string; pipeline: string }>('/health');
      
      if (!response.success || !response.data) {
        throw new Error('Health check failed');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Health check failed');
    }
  },

  // Get API information
  getApiInfo: async (): Promise<{
    message: string;
    version: string;
    endpoints: Record<string, string>;
  }> => {
    try {
      const response = await api.get<{
        message: string;
        version: string;
        endpoints: Record<string, string>;
      }>('/');
      
      if (!response.success || !response.data) {
        throw new Error('Failed to get API info');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get API info');
    }
  },
};

export default crewaiService;