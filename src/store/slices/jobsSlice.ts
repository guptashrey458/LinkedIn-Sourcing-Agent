import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { JobDescription, JobTemplate, JobFilters } from '../../types';

// Jobs state interface
export interface JobsState {
  jobs: JobDescription[];
  templates: JobTemplate[];
  selectedJob: JobDescription | null;
  filters: JobFilters;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Initial state
const initialState: JobsState = {
  jobs: [],
  templates: [],
  selectedJob: null,
  filters: {},
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasNext: false,
    hasPrev: false,
  },
};

// Async thunks for job operations
export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (params: { page?: number; limit?: number; filters?: JobFilters }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page: (params.page || 1).toString(),
        limit: (params.limit || 20).toString(),
        ...Object.fromEntries(
          Object.entries(params.filters || {}).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(',') : value?.toString() || '',
          ])
        ),
      });

      const response = await fetch(`/api/jobs?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch jobs');
    }
  }
);

export const fetchJobById = createAsyncThunk(
  'jobs/fetchJobById',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch job');
    }
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData: Omit<JobDescription, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create job');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create job');
    }
  }
);

export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async ({ id, updates }: { id: string; updates: Partial<JobDescription> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update job');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update job');
    }
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete job');
      }
      
      return jobId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete job');
    }
  }
);

export const fetchJobTemplates = createAsyncThunk(
  'jobs/fetchJobTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/job-templates');
      
      if (!response.ok) {
        throw new Error('Failed to fetch job templates');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch job templates');
    }
  }
);

export const createJobTemplate = createAsyncThunk(
  'jobs/createJobTemplate',
  async (templateData: Omit<JobTemplate, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/job-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create job template');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create job template');
    }
  }
);

// Jobs slice
const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    // Set selected job
    setSelectedJob: (state, action: PayloadAction<JobDescription | null>) => {
      state.selectedJob = action.payload;
    },
    
    // Update filters
    setFilters: (state, action: PayloadAction<JobFilters>) => {
      state.filters = action.payload;
    },
    
    // Clear filters
    clearFilters: (state) => {
      state.filters = {};
    },
    
    // Set pagination
    setPagination: (state, action: PayloadAction<Partial<JobsState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset jobs state
    resetJobs: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch jobs
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload.data;
        state.pagination = action.payload.meta;
        state.error = null;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch job by ID
    builder
      .addCase(fetchJobById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedJob = action.payload;
        state.error = null;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create job
    builder
      .addCase(createJob.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.isCreating = false;
        state.jobs.unshift(action.payload);
        state.error = null;
      })
      .addCase(createJob.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      });

    // Update job
    builder
      .addCase(updateJob.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.jobs.findIndex(job => job.id === action.payload.id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        if (state.selectedJob?.id === action.payload.id) {
          state.selectedJob = action.payload;
        }
        state.error = null;
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Delete job
    builder
      .addCase(deleteJob.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.jobs = state.jobs.filter(job => job.id !== action.payload);
        if (state.selectedJob?.id === action.payload) {
          state.selectedJob = null;
        }
        state.error = null;
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      });

    // Fetch job templates
    builder
      .addCase(fetchJobTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;
      });

    // Create job template
    builder
      .addCase(createJobTemplate.fulfilled, (state, action) => {
        state.templates.push(action.payload);
      });
  },
});

// Export actions
export const {
  setSelectedJob,
  setFilters,
  clearFilters,
  setPagination,
  clearError,
  resetJobs,
} = jobsSlice.actions;

// Selectors
export const selectJobs = (state: { jobs: JobsState }) => state.jobs.jobs;
export const selectJobTemplates = (state: { jobs: JobsState }) => state.jobs.templates;
export const selectSelectedJob = (state: { jobs: JobsState }) => state.jobs.selectedJob;
export const selectJobFilters = (state: { jobs: JobsState }) => state.jobs.filters;
export const selectJobsLoading = (state: { jobs: JobsState }) => state.jobs.isLoading;
export const selectJobsCreating = (state: { jobs: JobsState }) => state.jobs.isCreating;
export const selectJobsUpdating = (state: { jobs: JobsState }) => state.jobs.isUpdating;
export const selectJobsDeleting = (state: { jobs: JobsState }) => state.jobs.isDeleting;
export const selectJobsError = (state: { jobs: JobsState }) => state.jobs.error;
export const selectJobsPagination = (state: { jobs: JobsState }) => state.jobs.pagination;

export default jobsSlice.reducer;