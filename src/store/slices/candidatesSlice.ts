import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Candidate, CandidateFilters } from '../../types';

// Candidates state interface
export interface CandidatesState {
  candidates: Candidate[];
  selectedCandidates: string[];
  selectedCandidate: Candidate | null;
  filters: CandidateFilters;
  sortBy: {
    field: keyof Candidate;
    direction: 'asc' | 'desc';
  };
  isLoading: boolean;
  isUpdating: boolean;
  isBulkUpdating: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  searchQuery: string;
}

// Initial state
const initialState: CandidatesState = {
  candidates: [],
  selectedCandidates: [],
  selectedCandidate: null,
  filters: {},
  sortBy: {
    field: 'score',
    direction: 'desc',
  },
  isLoading: false,
  isUpdating: false,
  isBulkUpdating: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    hasNext: false,
    hasPrev: false,
  },
  searchQuery: '',
};

// Async thunks for candidate operations
export const fetchCandidates = createAsyncThunk(
  'candidates/fetchCandidates',
  async (params: { 
    page?: number; 
    limit?: number; 
    filters?: CandidateFilters;
    sortBy?: CandidatesState['sortBy'];
    search?: string;
  }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page: (params.page || 1).toString(),
        limit: (params.limit || 50).toString(),
        sortField: params.sortBy?.field || 'score',
        sortDirection: params.sortBy?.direction || 'desc',
        search: params.search || '',
      });

      // Add filters to query params
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              queryParams.append(key, value.join(','));
            } else if (typeof value === 'object' && 'length' in value) {
              // Handle range filters like scoreRange, experience
              queryParams.append(key, `${value[0]}-${value[1]}`);
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      const response = await fetch(`/api/candidates?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch candidates');
    }
  }
);

export const fetchCandidateById = createAsyncThunk(
  'candidates/fetchCandidateById',
  async (candidateId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch candidate');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch candidate');
    }
  }
);

export const updateCandidate = createAsyncThunk(
  'candidates/updateCandidate',
  async ({ id, updates }: { id: string; updates: Partial<Candidate> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update candidate');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update candidate');
    }
  }
);

export const bulkUpdateCandidates = createAsyncThunk(
  'candidates/bulkUpdateCandidates',
  async ({ candidateIds, updates }: { candidateIds: string[]; updates: Partial<Candidate> }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/candidates/bulk-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateIds, updates }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to bulk update candidates');
      }
      
      const data = await response.json();
      return { candidateIds, updates: data.data };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to bulk update candidates');
    }
  }
);

export const exportCandidates = createAsyncThunk(
  'candidates/exportCandidates',
  async (params: {
    candidateIds?: string[];
    filters?: CandidateFilters;
    format: 'csv' | 'excel' | 'json';
    fields?: string[];
  }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/candidates/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error('Failed to export candidates');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidates-export.${params.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to export candidates');
    }
  }
);

// Candidates slice
const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    // Set selected candidates
    setSelectedCandidates: (state, action: PayloadAction<string[]>) => {
      state.selectedCandidates = action.payload;
    },
    
    // Toggle candidate selection
    toggleCandidateSelection: (state, action: PayloadAction<string>) => {
      const candidateId = action.payload;
      const index = state.selectedCandidates.indexOf(candidateId);
      if (index === -1) {
        state.selectedCandidates.push(candidateId);
      } else {
        state.selectedCandidates.splice(index, 1);
      }
    },
    
    // Select all candidates
    selectAllCandidates: (state) => {
      state.selectedCandidates = state.candidates.map(candidate => candidate.id);
    },
    
    // Clear selection
    clearSelection: (state) => {
      state.selectedCandidates = [];
    },
    
    // Set selected candidate
    setSelectedCandidate: (state, action: PayloadAction<Candidate | null>) => {
      state.selectedCandidate = action.payload;
    },
    
    // Update filters
    setFilters: (state, action: PayloadAction<CandidateFilters>) => {
      state.filters = action.payload;
    },
    
    // Clear filters
    clearFilters: (state) => {
      state.filters = {};
    },
    
    // Set sort
    setSortBy: (state, action: PayloadAction<CandidatesState['sortBy']>) => {
      state.sortBy = action.payload;
    },
    
    // Set search query
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    // Set pagination
    setPagination: (state, action: PayloadAction<Partial<CandidatesState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset candidates state
    resetCandidates: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch candidates
    builder
      .addCase(fetchCandidates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.candidates = action.payload.data;
        state.pagination = action.payload.meta;
        state.error = null;
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch candidate by ID
    builder
      .addCase(fetchCandidateById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCandidateById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedCandidate = action.payload;
        state.error = null;
      })
      .addCase(fetchCandidateById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update candidate
    builder
      .addCase(updateCandidate.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateCandidate.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.candidates.findIndex(candidate => candidate.id === action.payload.id);
        if (index !== -1) {
          state.candidates[index] = action.payload;
        }
        if (state.selectedCandidate?.id === action.payload.id) {
          state.selectedCandidate = action.payload;
        }
        state.error = null;
      })
      .addCase(updateCandidate.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Bulk update candidates
    builder
      .addCase(bulkUpdateCandidates.pending, (state) => {
        state.isBulkUpdating = true;
        state.error = null;
      })
      .addCase(bulkUpdateCandidates.fulfilled, (state, action) => {
        state.isBulkUpdating = false;
        const { candidateIds, updates } = action.payload;
        
        // Update candidates in the list
        state.candidates = state.candidates.map(candidate => {
          if (candidateIds.includes(candidate.id)) {
            return { ...candidate, ...updates };
          }
          return candidate;
        });
        
        // Clear selection after bulk update
        state.selectedCandidates = [];
        state.error = null;
      })
      .addCase(bulkUpdateCandidates.rejected, (state, action) => {
        state.isBulkUpdating = false;
        state.error = action.payload as string;
      });

    // Export candidates
    builder
      .addCase(exportCandidates.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setSelectedCandidates,
  toggleCandidateSelection,
  selectAllCandidates,
  clearSelection,
  setSelectedCandidate,
  setFilters,
  clearFilters,
  setSortBy,
  setSearchQuery,
  setPagination,
  clearError,
  resetCandidates,
} = candidatesSlice.actions;

// Selectors
export const selectCandidates = (state: { candidates: CandidatesState }) => state.candidates.candidates;
export const selectSelectedCandidates = (state: { candidates: CandidatesState }) => state.candidates.selectedCandidates;
export const selectSelectedCandidate = (state: { candidates: CandidatesState }) => state.candidates.selectedCandidate;
export const selectCandidateFilters = (state: { candidates: CandidatesState }) => state.candidates.filters;
export const selectCandidateSortBy = (state: { candidates: CandidatesState }) => state.candidates.sortBy;
export const selectCandidatesLoading = (state: { candidates: CandidatesState }) => state.candidates.isLoading;
export const selectCandidatesUpdating = (state: { candidates: CandidatesState }) => state.candidates.isUpdating;
export const selectCandidatesBulkUpdating = (state: { candidates: CandidatesState }) => state.candidates.isBulkUpdating;
export const selectCandidatesError = (state: { candidates: CandidatesState }) => state.candidates.error;
export const selectCandidatesPagination = (state: { candidates: CandidatesState }) => state.candidates.pagination;
export const selectCandidatesSearchQuery = (state: { candidates: CandidatesState }) => state.candidates.searchQuery;

// Computed selectors
export const selectFilteredCandidates = (state: { candidates: CandidatesState }) => {
  const { candidates, filters, searchQuery } = state.candidates;
  
  return candidates.filter(candidate => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        candidate.name.toLowerCase().includes(query) ||
        candidate.title.toLowerCase().includes(query) ||
        candidate.company.toLowerCase().includes(query) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }
    
    // Score range filter
    if (filters.scoreRange) {
      const [min, max] = filters.scoreRange;
      if (candidate.score < min || candidate.score > max) return false;
    }
    
    // Location filter
    if (filters.location && filters.location.length > 0) {
      if (!filters.location.some(loc => candidate.location.toLowerCase().includes(loc.toLowerCase()))) {
        return false;
      }
    }
    
    // Skills filter
    if (filters.skills && filters.skills.length > 0) {
      if (!filters.skills.some(skill => 
        candidate.skills.some(candidateSkill => 
          candidateSkill.toLowerCase().includes(skill.toLowerCase())
        )
      )) {
        return false;
      }
    }
    
    // Experience filter
    if (filters.experience) {
      const [min, max] = filters.experience;
      if (candidate.experience < min || candidate.experience > max) return false;
    }
    
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(candidate.status)) return false;
    }
    
    return true;
  });
};

export default candidatesSlice.reducer;