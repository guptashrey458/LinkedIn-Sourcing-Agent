import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { createTestQueryClient, mockFetch, createMockCandidate, mockApiResponse } from '@/test';
import candidatesSlice, {
  fetchCandidates,
  fetchCandidateById,
  updateCandidate,
  bulkUpdateCandidates,
  setFilters,
  clearFilters,
  selectCandidate,
  deselectCandidate,
  selectAllCandidates,
  deselectAllCandidates,
} from '../candidatesSlice';

describe('Candidates Slice Integration Tests', () => {
  let store: ReturnType<typeof configureStore>;
  
  beforeEach(() => {
    store = configureStore({
      reducer: {
        candidates: candidatesSlice,
      },
    });
  });

  describe('fetchCandidates async thunk', () => {
    it('handles successful fetch', async () => {
      const mockCandidates = [
        createMockCandidate({ id: '1', name: 'John Doe' }),
        createMockCandidate({ id: '2', name: 'Jane Smith' }),
      ];
      
      mockFetch(mockApiResponse({
        candidates: mockCandidates,
        total: 2,
        page: 1,
        limit: 20,
        hasNext: false,
        hasPrev: false,
      }));
      
      const result = await store.dispatch(fetchCandidates({ page: 1, limit: 20 }));
      
      expect(result.type).toBe('candidates/fetchCandidates/fulfilled');
      expect(result.payload.candidates).toHaveLength(2);
      
      const state = store.getState().candidates;
      expect(state.items).toHaveLength(2);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.pagination.total).toBe(2);
    });

    it('handles fetch error', async () => {
      mockFetch(mockApiResponse(null, false, 'Server error'), 500);
      
      const result = await store.dispatch(fetchCandidates({ page: 1, limit: 20 }));
      
      expect(result.type).toBe('candidates/fetchCandidates/rejected');
      
      const state = store.getState().candidates;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Server error');
    });

    it('handles network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const result = await store.dispatch(fetchCandidates({ page: 1, limit: 20 }));
      
      expect(result.type).toBe('candidates/fetchCandidates/rejected');
      
      const state = store.getState().candidates;
      expect(state.loading).toBe(false);
      expect(state.error).toContain('Network error');
    });
  });

  describe('fetchCandidateById async thunk', () => {
    it('handles successful fetch', async () => {
      const mockCandidate = createMockCandidate({ id: '1', name: 'John Doe' });
      
      mockFetch(mockApiResponse(mockCandidate));
      
      const result = await store.dispatch(fetchCandidateById('1'));
      
      expect(result.type).toBe('candidates/fetchCandidateById/fulfilled');
      expect(result.payload.id).toBe('1');
      
      const state = store.getState().candidates;
      expect(state.selectedCandidate).toEqual(mockCandidate);
    });

    it('handles candidate not found', async () => {
      mockFetch(mockApiResponse(null, false, 'Candidate not found'), 404);
      
      const result = await store.dispatch(fetchCandidateById('999'));
      
      expect(result.type).toBe('candidates/fetchCandidateById/rejected');
      
      const state = store.getState().candidates;
      expect(state.selectedCandidate).toBeNull();
      expect(state.error).toBe('Candidate not found');
    });
  });

  describe('updateCandidate async thunk', () => {
    it('handles successful update', async () => {
      const originalCandidate = createMockCandidate({ id: '1', status: 'new' });
      const updatedCandidate = { ...originalCandidate, status: 'contacted' as const };
      
      // Set initial state
      store.dispatch({ type: 'candidates/fetchCandidates/fulfilled', payload: {
        candidates: [originalCandidate],
        total: 1,
        page: 1,
        limit: 20,
        hasNext: false,
        hasPrev: false,
      }});
      
      mockFetch(mockApiResponse(updatedCandidate));
      
      const result = await store.dispatch(updateCandidate({
        id: '1',
        updates: { status: 'contacted' },
      }));
      
      expect(result.type).toBe('candidates/updateCandidate/fulfilled');
      
      const state = store.getState().candidates;
      const candidate = state.items.find(c => c.id === '1');
      expect(candidate?.status).toBe('contacted');
    });
  });

  describe('bulkUpdateCandidates async thunk', () => {
    it('handles successful bulk update', async () => {
      const candidates = [
        createMockCandidate({ id: '1', status: 'new' }),
        createMockCandidate({ id: '2', status: 'new' }),
      ];
      
      // Set initial state
      store.dispatch({ type: 'candidates/fetchCandidates/fulfilled', payload: {
        candidates,
        total: 2,
        page: 1,
        limit: 20,
        hasNext: false,
        hasPrev: false,
      }});
      
      const updatedCandidates = candidates.map(c => ({ ...c, status: 'contacted' as const }));
      mockFetch(mockApiResponse(updatedCandidates));
      
      const result = await store.dispatch(bulkUpdateCandidates({
        candidateIds: ['1', '2'],
        updates: { status: 'contacted' },
      }));
      
      expect(result.type).toBe('candidates/bulkUpdateCandidates/fulfilled');
      
      const state = store.getState().candidates;
      expect(state.items.every(c => c.status === 'contacted')).toBe(true);
    });
  });

  describe('filters', () => {
    it('sets and clears filters correctly', () => {
      const filters = {
        search: 'John',
        minScore: 80,
        maxScore: 100,
        location: 'San Francisco',
        skills: ['JavaScript', 'React'],
        status: ['new', 'contacted'] as const,
      };
      
      store.dispatch(setFilters(filters));
      
      let state = store.getState().candidates;
      expect(state.filters).toEqual(filters);
      
      store.dispatch(clearFilters());
      
      state = store.getState().candidates;
      expect(state.filters).toEqual({
        search: '',
        minScore: 0,
        maxScore: 100,
        location: '',
        skills: [],
        status: [],
      });
    });
  });

  describe('selection', () => {
    beforeEach(() => {
      const candidates = [
        createMockCandidate({ id: '1', name: 'John Doe' }),
        createMockCandidate({ id: '2', name: 'Jane Smith' }),
        createMockCandidate({ id: '3', name: 'Bob Johnson' }),
      ];
      
      store.dispatch({ type: 'candidates/fetchCandidates/fulfilled', payload: {
        candidates,
        total: 3,
        page: 1,
        limit: 20,
        hasNext: false,
        hasPrev: false,
      }});
    });

    it('selects and deselects individual candidates', () => {
      store.dispatch(selectCandidate('1'));
      
      let state = store.getState().candidates;
      expect(state.selectedIds).toContain('1');
      
      store.dispatch(selectCandidate('2'));
      
      state = store.getState().candidates;
      expect(state.selectedIds).toEqual(['1', '2']);
      
      store.dispatch(deselectCandidate('1'));
      
      state = store.getState().candidates;
      expect(state.selectedIds).toEqual(['2']);
    });

    it('selects and deselects all candidates', () => {
      store.dispatch(selectAllCandidates());
      
      let state = store.getState().candidates;
      expect(state.selectedIds).toEqual(['1', '2', '3']);
      
      store.dispatch(deselectAllCandidates());
      
      state = store.getState().candidates;
      expect(state.selectedIds).toEqual([]);
    });

    it('prevents duplicate selections', () => {
      store.dispatch(selectCandidate('1'));
      store.dispatch(selectCandidate('1')); // Duplicate
      
      const state = store.getState().candidates;
      expect(state.selectedIds).toEqual(['1']);
    });
  });

  describe('pagination', () => {
    it('updates pagination state correctly', async () => {
      const mockCandidates = Array.from({ length: 20 }, (_, i) => 
        createMockCandidate({ id: `${i + 1}` })
      );
      
      mockFetch(mockApiResponse({
        candidates: mockCandidates,
        total: 100,
        page: 2,
        limit: 20,
        hasNext: true,
        hasPrev: true,
      }));
      
      await store.dispatch(fetchCandidates({ page: 2, limit: 20 }));
      
      const state = store.getState().candidates;
      expect(state.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 100,
        hasNext: true,
        hasPrev: true,
      });
    });
  });

  describe('loading states', () => {
    it('manages loading state during async operations', async () => {
      // Mock a slow response
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve(mockApiResponse({ candidates: [], total: 0 })),
          }), 100)
        )
      );
      
      const fetchPromise = store.dispatch(fetchCandidates({ page: 1, limit: 20 }));
      
      // Should be loading
      let state = store.getState().candidates;
      expect(state.loading).toBe(true);
      
      await fetchPromise;
      
      // Should not be loading
      state = store.getState().candidates;
      expect(state.loading).toBe(false);
    });
  });

  describe('error handling', () => {
    it('clears errors when starting new operations', async () => {
      // First, create an error state
      mockFetch(mockApiResponse(null, false, 'Server error'), 500);
      await store.dispatch(fetchCandidates({ page: 1, limit: 20 }));
      
      let state = store.getState().candidates;
      expect(state.error).toBe('Server error');
      
      // Then, start a new successful operation
      mockFetch(mockApiResponse({ candidates: [], total: 0 }));
      await store.dispatch(fetchCandidates({ page: 1, limit: 20 }));
      
      state = store.getState().candidates;
      expect(state.error).toBeNull();
    });
  });
});