import { api } from './api';
import { Candidate, CandidateFilters, ApiResponse } from '../types';

// Candidates service request/response types
export interface UpdateCandidateRequest extends Partial<Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>> {}

export interface CandidatesListResponse {
  candidates: Candidate[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CandidateSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  scoreRange?: [number, number];
  location?: string[];
  skills?: string[];
  experience?: [number, number];
  status?: Candidate['status'][];
  sortBy?: keyof Candidate;
  sortOrder?: 'asc' | 'desc';
}

export interface BulkUpdateCandidatesRequest {
  candidateIds: string[];
  updates: UpdateCandidateRequest;
}

export interface ExportCandidatesRequest {
  candidateIds?: string[];
  filters?: CandidateFilters;
  format: 'csv' | 'excel' | 'json';
  fields?: string[];
}

export interface CandidateAnalytics {
  totalCandidates: number;
  averageScore: number;
  scoreDistribution: Array<{ range: string; count: number }>;
  topSkills: Array<{ skill: string; count: number }>;
  locationDistribution: Array<{ location: string; count: number }>;
  statusDistribution: Array<{ status: Candidate['status']; count: number }>;
  experienceDistribution: Array<{ range: string; count: number }>;
}

// Candidates service
export const candidatesService = {
  // Get all candidates with filtering and pagination
  getCandidates: async (params: CandidateSearchParams = {}): Promise<CandidatesListResponse> => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination params
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      // Add search params
      if (params.search) queryParams.append('search', params.search);
      
      // Add filter params
      if (params.scoreRange) {
        queryParams.append('minScore', params.scoreRange[0].toString());
        queryParams.append('maxScore', params.scoreRange[1].toString());
      }
      if (params.location && params.location.length > 0) {
        queryParams.append('location', params.location.join(','));
      }
      if (params.skills && params.skills.length > 0) {
        queryParams.append('skills', params.skills.join(','));
      }
      if (params.experience) {
        queryParams.append('minExperience', params.experience[0].toString());
        queryParams.append('maxExperience', params.experience[1].toString());
      }
      if (params.status && params.status.length > 0) {
        queryParams.append('status', params.status.join(','));
      }
      
      // Add sorting params
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
      const response = await api.get<CandidatesListResponse>(`/candidates?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch candidates');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch candidates');
    }
  },
  
  // Get candidate by ID
  getCandidateById: async (candidateId: string): Promise<Candidate> => {
    try {
      const response = await api.get<Candidate>(`/candidates/${candidateId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch candidate');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch candidate');
    }
  },
  
  // Update candidate
  updateCandidate: async (candidateId: string, updates: UpdateCandidateRequest): Promise<Candidate> => {
    try {
      const response = await api.put<Candidate>(`/candidates/${candidateId}`, updates);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update candidate');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update candidate');
    }
  },
  
  // Bulk update candidates
  bulkUpdateCandidates: async (request: BulkUpdateCandidatesRequest): Promise<Candidate[]> => {
    try {
      const response = await api.put<Candidate[]>('/candidates/bulk-update', request);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to bulk update candidates');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to bulk update candidates');
    }
  },
  
  // Delete candidate
  deleteCandidate: async (candidateId: string): Promise<void> => {
    try {
      const response = await api.delete(`/candidates/${candidateId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete candidate');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete candidate');
    }
  },
  
  // Bulk delete candidates
  bulkDeleteCandidates: async (candidateIds: string[]): Promise<void> => {
    try {
      const response = await api.delete('/candidates/bulk-delete', {
        data: { candidateIds },
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to bulk delete candidates');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to bulk delete candidates');
    }
  },
  
  // Add tags to candidate
  addCandidateTags: async (candidateId: string, tags: string[]): Promise<Candidate> => {
    try {
      const response = await api.post<Candidate>(`/candidates/${candidateId}/tags`, { tags });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to add tags to candidate');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add tags to candidate');
    }
  },
  
  // Remove tags from candidate
  removeCandidateTags: async (candidateId: string, tags: string[]): Promise<Candidate> => {
    try {
      const response = await api.delete(`/candidates/${candidateId}/tags`, {
        data: { tags },
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to remove tags from candidate');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to remove tags from candidate');
    }
  },
  
  // Get candidate interaction history
  getCandidateHistory: async (candidateId: string): Promise<Array<{
    id: string;
    type: 'status_change' | 'tag_added' | 'tag_removed' | 'note_added' | 'message_sent';
    description: string;
    timestamp: Date;
    userId: string;
    userName: string;
  }>> => {
    try {
      const response = await api.get(`/candidates/${candidateId}/history`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch candidate history');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch candidate history');
    }
  },
  
  // Add note to candidate
  addCandidateNote: async (candidateId: string, note: string): Promise<void> => {
    try {
      const response = await api.post(`/candidates/${candidateId}/notes`, { note });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to add note to candidate');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add note to candidate');
    }
  },
  
  // Search candidates with advanced filters
  searchCandidates: async (query: string, filters?: CandidateFilters): Promise<Candidate[]> => {
    try {
      const response = await api.post<Candidate[]>('/candidates/search', {
        query,
        filters,
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to search candidates');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to search candidates');
    }
  },
  
  // Get similar candidates
  getSimilarCandidates: async (candidateId: string, limit: number = 10): Promise<Candidate[]> => {
    try {
      const response = await api.get<Candidate[]>(`/candidates/${candidateId}/similar?limit=${limit}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch similar candidates');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch similar candidates');
    }
  },
  
  // Compare candidates
  compareCandidates: async (candidateIds: string[]): Promise<{
    candidates: Candidate[];
    comparison: {
      skills: Array<{ skill: string; candidates: Array<{ id: string; hasSkill: boolean }> }>;
      experience: Array<{ id: string; experience: number }>;
      scores: Array<{ id: string; score: number; breakdown: any }>;
      locations: Array<{ id: string; location: string }>;
    };
  }> => {
    try {
      const response = await api.post('/candidates/compare', { candidateIds });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to compare candidates');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to compare candidates');
    }
  },
  
  // Export candidates
  exportCandidates: async (request: ExportCandidatesRequest): Promise<void> => {
    try {
      const response = await api.post('/candidates/export', request, {
        responseType: 'blob',
      });
      
      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `candidates-export.${request.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to export candidates');
    }
  },
  
  // Get candidate analytics
  getCandidateAnalytics: async (filters?: CandidateFilters): Promise<CandidateAnalytics> => {
    try {
      const response = await api.post<CandidateAnalytics>('/candidates/analytics', { filters });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch candidate analytics');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch candidate analytics');
    }
  },
  
  // Get candidates by job ID
  getCandidatesByJobId: async (jobId: string, params: CandidateSearchParams = {}): Promise<CandidatesListResponse> => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination params
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      // Add other params
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && key !== 'page' && key !== 'limit') {
          if (Array.isArray(value)) {
            queryParams.append(key, value.join(','));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
      
      const response = await api.get<CandidatesListResponse>(`/jobs/${jobId}/candidates?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch candidates for job');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch candidates for job');
    }
  },
  
  // Get all available tags
  getAllTags: async (): Promise<string[]> => {
    try {
      const response = await api.get<string[]>('/candidates/tags');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch candidate tags');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch candidate tags');
    }
  },
  
  // Get all available skills
  getAllSkills: async (): Promise<string[]> => {
    try {
      const response = await api.get<string[]>('/candidates/skills');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch candidate skills');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch candidate skills');
    }
  },
  
  // Get all available locations
  getAllLocations: async (): Promise<string[]> => {
    try {
      const response = await api.get<string[]>('/candidates/locations');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch candidate locations');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch candidate locations');
    }
  },
};

export default candidatesService;