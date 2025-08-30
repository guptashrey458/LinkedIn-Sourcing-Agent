import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PipelineRun, PipelineStage, PipelineError, PipelineFilters } from '../../types';

// Pipeline state interface
export interface PipelineState {
  activePipelines: PipelineRun[];
  pipelineHistory: PipelineRun[];
  selectedPipeline: PipelineRun | null;
  filters: PipelineFilters;
  isLoading: boolean;
  isStarting: boolean;
  isStopping: boolean;
  error: string | null;
  realTimeUpdates: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Initial state
const initialState: PipelineState = {
  activePipelines: [],
  pipelineHistory: [],
  selectedPipeline: null,
  filters: {},
  isLoading: false,
  isStarting: false,
  isStopping: false,
  error: null,
  realTimeUpdates: true,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasNext: false,
    hasPrev: false,
  },
};

// Async thunks for pipeline operations
export const startPipeline = createAsyncThunk(
  'pipeline/startPipeline',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/pipeline/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start pipeline');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to start pipeline');
    }
  }
);

export const stopPipeline = createAsyncThunk(
  'pipeline/stopPipeline',
  async (pipelineId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/pipeline/${pipelineId}/stop`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to stop pipeline');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to stop pipeline');
    }
  }
);

export const fetchActivePipelines = createAsyncThunk(
  'pipeline/fetchActivePipelines',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/pipeline/active');
      
      if (!response.ok) {
        throw new Error('Failed to fetch active pipelines');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch active pipelines');
    }
  }
);

export const fetchPipelineHistory = createAsyncThunk(
  'pipeline/fetchPipelineHistory',
  async (params: { 
    page?: number; 
    limit?: number; 
    filters?: PipelineFilters;
  }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page: (params.page || 1).toString(),
        limit: (params.limit || 20).toString(),
      });

      // Add filters to query params
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              queryParams.append(key, value.join(','));
            } else if (typeof value === 'object' && 'length' in value) {
              // Handle date range filters
              queryParams.append(key, `${value[0].toISOString()}-${value[1].toISOString()}`);
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      const response = await fetch(`/api/pipeline/history?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline history');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch pipeline history');
    }
  }
);

export const fetchPipelineById = createAsyncThunk(
  'pipeline/fetchPipelineById',
  async (pipelineId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/pipeline/${pipelineId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch pipeline');
    }
  }
);

export const retryPipelineStage = createAsyncThunk(
  'pipeline/retryPipelineStage',
  async ({ pipelineId, stageName }: { pipelineId: string; stageName: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/pipeline/${pipelineId}/retry/${stageName}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to retry pipeline stage');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to retry pipeline stage');
    }
  }
);

// Pipeline slice
const pipelineSlice = createSlice({
  name: 'pipeline',
  initialState,
  reducers: {
    // Set selected pipeline
    setSelectedPipeline: (state, action: PayloadAction<PipelineRun | null>) => {
      state.selectedPipeline = action.payload;
    },
    
    // Update pipeline in real-time
    updatePipelineProgress: (state, action: PayloadAction<{
      pipelineId: string;
      stage: PipelineStage;
      progress?: number;
    }>) => {
      const { pipelineId, stage, progress } = action.payload;
      
      // Update in active pipelines
      const activePipeline = state.activePipelines.find(p => p.id === pipelineId);
      if (activePipeline) {
        activePipeline.currentStage = stage;
        const stageIndex = activePipeline.stages.findIndex(s => s.name === stage.name);
        if (stageIndex !== -1) {
          activePipeline.stages[stageIndex] = { ...activePipeline.stages[stageIndex], ...stage };
        }
        if (progress !== undefined) {
          activePipeline.stages[stageIndex].progress = progress;
        }
      }
      
      // Update selected pipeline if it matches
      if (state.selectedPipeline?.id === pipelineId) {
        state.selectedPipeline.currentStage = stage;
        const stageIndex = state.selectedPipeline.stages.findIndex(s => s.name === stage.name);
        if (stageIndex !== -1) {
          state.selectedPipeline.stages[stageIndex] = { ...state.selectedPipeline.stages[stageIndex], ...stage };
        }
      }
    },
    
    // Add pipeline error
    addPipelineError: (state, action: PayloadAction<{
      pipelineId: string;
      error: PipelineError;
    }>) => {
      const { pipelineId, error } = action.payload;
      
      const activePipeline = state.activePipelines.find(p => p.id === pipelineId);
      if (activePipeline) {
        activePipeline.errors.push(error);
      }
      
      if (state.selectedPipeline?.id === pipelineId) {
        state.selectedPipeline.errors.push(error);
      }
    },
    
    // Complete pipeline
    completePipeline: (state, action: PayloadAction<{
      pipelineId: string;
      status: 'completed' | 'failed' | 'cancelled';
      endTime: Date;
      candidatesFound?: number;
    }>) => {
      const { pipelineId, status, endTime, candidatesFound } = action.payload;
      
      const activePipelineIndex = state.activePipelines.findIndex(p => p.id === pipelineId);
      if (activePipelineIndex !== -1) {
        const pipeline = state.activePipelines[activePipelineIndex];
        pipeline.status = status;
        pipeline.endTime = endTime;
        pipeline.duration = endTime.getTime() - pipeline.startTime.getTime();
        if (candidatesFound !== undefined) {
          pipeline.candidatesFound = candidatesFound;
        }
        
        // Move to history
        state.pipelineHistory.unshift(pipeline);
        state.activePipelines.splice(activePipelineIndex, 1);
      }
      
      if (state.selectedPipeline?.id === pipelineId) {
        state.selectedPipeline.status = status;
        state.selectedPipeline.endTime = endTime;
        state.selectedPipeline.duration = endTime.getTime() - state.selectedPipeline.startTime.getTime();
        if (candidatesFound !== undefined) {
          state.selectedPipeline.candidatesFound = candidatesFound;
        }
      }
    },
    
    // Update filters
    setFilters: (state, action: PayloadAction<PipelineFilters>) => {
      state.filters = action.payload;
    },
    
    // Clear filters
    clearFilters: (state) => {
      state.filters = {};
    },
    
    // Toggle real-time updates
    toggleRealTimeUpdates: (state) => {
      state.realTimeUpdates = !state.realTimeUpdates;
    },
    
    // Set real-time updates
    setRealTimeUpdates: (state, action: PayloadAction<boolean>) => {
      state.realTimeUpdates = action.payload;
    },
    
    // Set pagination
    setPagination: (state, action: PayloadAction<Partial<PipelineState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset pipeline state
    resetPipeline: () => initialState,
  },
  extraReducers: (builder) => {
    // Start pipeline
    builder
      .addCase(startPipeline.pending, (state) => {
        state.isStarting = true;
        state.error = null;
      })
      .addCase(startPipeline.fulfilled, (state, action) => {
        state.isStarting = false;
        state.activePipelines.push(action.payload);
        state.error = null;
      })
      .addCase(startPipeline.rejected, (state, action) => {
        state.isStarting = false;
        state.error = action.payload as string;
      });

    // Stop pipeline
    builder
      .addCase(stopPipeline.pending, (state) => {
        state.isStopping = true;
        state.error = null;
      })
      .addCase(stopPipeline.fulfilled, (state, action) => {
        state.isStopping = false;
        const pipelineIndex = state.activePipelines.findIndex(p => p.id === action.payload.id);
        if (pipelineIndex !== -1) {
          state.activePipelines[pipelineIndex] = action.payload;
        }
        state.error = null;
      })
      .addCase(stopPipeline.rejected, (state, action) => {
        state.isStopping = false;
        state.error = action.payload as string;
      });

    // Fetch active pipelines
    builder
      .addCase(fetchActivePipelines.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivePipelines.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activePipelines = action.payload;
        state.error = null;
      })
      .addCase(fetchActivePipelines.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch pipeline history
    builder
      .addCase(fetchPipelineHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPipelineHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pipelineHistory = action.payload.data;
        state.pagination = action.payload.meta;
        state.error = null;
      })
      .addCase(fetchPipelineHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch pipeline by ID
    builder
      .addCase(fetchPipelineById.fulfilled, (state, action) => {
        state.selectedPipeline = action.payload;
      });

    // Retry pipeline stage
    builder
      .addCase(retryPipelineStage.fulfilled, (state, action) => {
        const pipelineIndex = state.activePipelines.findIndex(p => p.id === action.payload.id);
        if (pipelineIndex !== -1) {
          state.activePipelines[pipelineIndex] = action.payload;
        }
        if (state.selectedPipeline?.id === action.payload.id) {
          state.selectedPipeline = action.payload;
        }
      });
  },
});

// Export actions
export const {
  setSelectedPipeline,
  updatePipelineProgress,
  addPipelineError,
  completePipeline,
  setFilters,
  clearFilters,
  toggleRealTimeUpdates,
  setRealTimeUpdates,
  setPagination,
  clearError,
  resetPipeline,
} = pipelineSlice.actions;

// Selectors
export const selectActivePipelines = (state: { pipeline: PipelineState }) => state.pipeline.activePipelines;
export const selectPipelineHistory = (state: { pipeline: PipelineState }) => state.pipeline.pipelineHistory;
export const selectSelectedPipeline = (state: { pipeline: PipelineState }) => state.pipeline.selectedPipeline;
export const selectPipelineFilters = (state: { pipeline: PipelineState }) => state.pipeline.filters;
export const selectPipelineLoading = (state: { pipeline: PipelineState }) => state.pipeline.isLoading;
export const selectPipelineStarting = (state: { pipeline: PipelineState }) => state.pipeline.isStarting;
export const selectPipelineStopping = (state: { pipeline: PipelineState }) => state.pipeline.isStopping;
export const selectPipelineError = (state: { pipeline: PipelineState }) => state.pipeline.error;
export const selectRealTimeUpdates = (state: { pipeline: PipelineState }) => state.pipeline.realTimeUpdates;
export const selectPipelinePagination = (state: { pipeline: PipelineState }) => state.pipeline.pagination;

// Computed selectors
export const selectRunningPipelines = (state: { pipeline: PipelineState }) => 
  state.pipeline.activePipelines.filter(p => p.status === 'running');

export const selectPipelineById = (pipelineId: string) => (state: { pipeline: PipelineState }) => 
  state.pipeline.activePipelines.find(p => p.id === pipelineId) || 
  state.pipeline.pipelineHistory.find(p => p.id === pipelineId);

export const selectPipelinesByJobId = (jobId: string) => (state: { pipeline: PipelineState }) => 
  [...state.pipeline.activePipelines, ...state.pipeline.pipelineHistory]
    .filter(p => p.jobId === jobId)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

export default pipelineSlice.reducer;