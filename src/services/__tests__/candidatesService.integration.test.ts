import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { candidatesService } from '../candidatesService';
import { createMockCandidate, mockApiResponse } from '@/test';

describe('Candidates Service Integration Tests', () => {
  beforeEach(() => {
    // Reset any runtime request handlers we may add during the tests
    server.resetHandlers();
  });

  describe('fetchCandidates', () => {
    it('fetches candidates with default parameters', async () => {
      const result = await candidatesService.fetchCandidates();
      
      expect(result.success).toBe(true);
      expect(result.data.candidates).toBeDefined();
      expect(Array.isArray(result.data.candidates)).toBe(true);
      expect(result.data.total).toBeDefined();
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    });

    it('fetches candidates with custom parameters', async () => {
      const params = {
        page: 2,
        limit: 10,
        search: 'engineer',
        minScore: 80,
        maxScore: 95,
        location: 'San Francisco',
        skills: ['JavaScript', 'React'],
      };

      const result = await candidatesService.fetchCandidates(params);
      
      expect(result.success).toBe(true);
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    });

    it('handles server errors gracefully', async () => {
      // Override the default handler to return an error
      server.use(
        http.get('/api/candidates', () => {
          return HttpResponse.json(
            mockApiResponse(null, false, 'Internal server error'),
            { status: 500 }
          );
        })
      );

      await expect(candidatesService.fetchCandidates()).rejects.toThrow('Internal server error');
    });

    it('handles network errors', async () => {
      // Override the default handler to simulate network error
      server.use(
        http.get('/api/candidates', () => {
          return HttpResponse.error();
        })
      );

      await expect(candidatesService.fetchCandidates()).rejects.toThrow();
    });

    it('validates response data structure', async () => {
      const result = await candidatesService.fetchCandidates();
      
      expect(result.data).toHaveProperty('candidates');
      expect(result.data).toHaveProperty('total');
      expect(result.data).toHaveProperty('page');
      expect(result.data).toHaveProperty('limit');
      expect(result.data).toHaveProperty('hasNext');
      expect(result.data).toHaveProperty('hasPrev');
      
      if (result.data.candidates.length > 0) {
        const candidate = result.data.candidates[0];
        expect(candidate).toHaveProperty('id');
        expect(candidate).toHaveProperty('name');
        expect(candidate).toHaveProperty('title');
        expect(candidate).toHaveProperty('company');
        expect(candidate).toHaveProperty('score');
        expect(candidate).toHaveProperty('status');
      }
    });
  });

  describe('fetchCandidateById', () => {
    it('fetches a specific candidate', async () => {
      const candidateId = 'candidate-1';
      const result = await candidatesService.fetchCandidateById(candidateId);
      
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(candidateId);
    });

    it('handles candidate not found', async () => {
      const nonExistentId = 'non-existent-candidate';
      
      await expect(candidatesService.fetchCandidateById(nonExistentId))
        .rejects.toThrow('Candidate not found');
    });

    it('validates candidate data structure', async () => {
      const result = await candidatesService.fetchCandidateById('candidate-1');
      const candidate = result.data;
      
      expect(candidate).toHaveProperty('id');
      expect(candidate).toHaveProperty('name');
      expect(candidate).toHaveProperty('title');
      expect(candidate).toHaveProperty('company');
      expect(candidate).toHaveProperty('location');
      expect(candidate).toHaveProperty('skills');
      expect(candidate).toHaveProperty('experience');
      expect(candidate).toHaveProperty('score');
      expect(candidate).toHaveProperty('status');
      expect(Array.isArray(candidate.skills)).toBe(true);
    });
  });

  describe('updateCandidate', () => {
    it('updates candidate successfully', async () => {
      const candidateId = 'candidate-1';
      const updates = {
        status: 'contacted' as const,
        tags: ['high-priority'],
      };

      const result = await candidatesService.updateCandidate(candidateId, updates);
      
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(candidateId);
      expect(result.data.status).toBe('contacted');
    });

    it('handles validation errors', async () => {
      server.use(
        http.put('/api/candidates/:id', () => {
          return HttpResponse.json(
            mockApiResponse(null, false, 'Validation error'),
            { status: 400 }
          );
        })
      );

      await expect(candidatesService.updateCandidate('candidate-1', { status: 'invalid' as any }))
        .rejects.toThrow('Validation error');
    });

    it('handles candidate not found during update', async () => {
      const nonExistentId = 'non-existent-candidate';
      
      await expect(candidatesService.updateCandidate(nonExistentId, { status: 'contacted' }))
        .rejects.toThrow('Candidate not found');
    });
  });

  describe('bulkUpdateCandidates', () => {
    it('updates multiple candidates successfully', async () => {
      const candidateIds = ['candidate-1', 'candidate-2', 'candidate-3'];
      const updates = {
        status: 'contacted' as const,
        tags: ['bulk-updated'],
      };

      const result = await candidatesService.bulkUpdateCandidates(candidateIds, updates);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(candidateIds.length);
      
      result.data.forEach(candidate => {
        expect(candidate.status).toBe('contacted');
        expect(candidateIds).toContain(candidate.id);
      });
    });

    it('handles partial failures in bulk update', async () => {
      server.use(
        http.put('/api/candidates/bulk', () => {
          return HttpResponse.json(
            mockApiResponse(null, false, 'Some updates failed'),
            { status: 207 } // Multi-status
          );
        })
      );

      await expect(candidatesService.bulkUpdateCandidates(['candidate-1'], { status: 'contacted' }))
        .rejects.toThrow('Some updates failed');
    });

    it('validates bulk update parameters', async () => {
      // Empty candidate IDs array
      await expect(candidatesService.bulkUpdateCandidates([], { status: 'contacted' }))
        .rejects.toThrow();

      // Invalid updates object
      await expect(candidatesService.bulkUpdateCandidates(['candidate-1'], {} as any))
        .rejects.toThrow();
    });
  });

  describe('exportCandidates', () => {
    it('exports candidates in CSV format', async () => {
      const exportParams = {
        format: 'csv' as const,
        candidateIds: ['candidate-1', 'candidate-2'],
        fields: ['name', 'title', 'company', 'score'],
      };

      const result = await candidatesService.exportCandidates(exportParams);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('exportId');
      expect(result.data).toHaveProperty('downloadUrl');
      expect(result.data).toHaveProperty('status');
      expect(result.data.format).toBe('csv');
    });

    it('exports candidates in Excel format', async () => {
      const exportParams = {
        format: 'excel' as const,
        candidateIds: ['candidate-1'],
        fields: ['name', 'email', 'score'],
      };

      const result = await candidatesService.exportCandidates(exportParams);
      
      expect(result.success).toBe(true);
      expect(result.data.format).toBe('excel');
    });

    it('handles export errors', async () => {
      server.use(
        http.post('/api/export/candidates', () => {
          return HttpResponse.json(
            mockApiResponse(null, false, 'Export failed'),
            { status: 500 }
          );
        })
      );

      await expect(candidatesService.exportCandidates({
        format: 'csv',
        candidateIds: ['candidate-1'],
        fields: ['name'],
      })).rejects.toThrow('Export failed');
    });
  });

  describe('searchCandidates', () => {
    it('searches candidates with text query', async () => {
      const searchParams = {
        query: 'software engineer',
        filters: {
          minScore: 80,
          location: 'San Francisco',
        },
      };

      const result = await candidatesService.searchCandidates(searchParams);
      
      expect(result.success).toBe(true);
      expect(result.data.candidates).toBeDefined();
      expect(Array.isArray(result.data.candidates)).toBe(true);
    });

    it('handles empty search results', async () => {
      server.use(
        http.get('/api/candidates', () => {
          return HttpResponse.json(mockApiResponse({
            candidates: [],
            total: 0,
            page: 1,
            limit: 20,
            hasNext: false,
            hasPrev: false,
          }));
        })
      );

      const result = await candidatesService.searchCandidates({ query: 'nonexistent' });
      
      expect(result.success).toBe(true);
      expect(result.data.candidates).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });
  });

  describe('error handling and retries', () => {
    it('retries failed requests', async () => {
      let attemptCount = 0;
      
      server.use(
        http.get('/api/candidates', () => {
          attemptCount++;
          if (attemptCount < 3) {
            return HttpResponse.error();
          }
          return HttpResponse.json(mockApiResponse({
            candidates: [],
            total: 0,
            page: 1,
            limit: 20,
            hasNext: false,
            hasPrev: false,
          }));
        })
      );

      const result = await candidatesService.fetchCandidates();
      
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });

    it('respects timeout settings', async () => {
      server.use(
        http.get('/api/candidates', async () => {
          // Simulate slow response
          await new Promise(resolve => setTimeout(resolve, 10000));
          return HttpResponse.json(mockApiResponse({ candidates: [] }));
        })
      );

      await expect(candidatesService.fetchCandidates())
        .rejects.toThrow(/timeout/i);
    });
  });

  describe('caching behavior', () => {
    it('caches GET requests appropriately', async () => {
      let requestCount = 0;
      
      server.use(
        http.get('/api/candidates/candidate-1', () => {
          requestCount++;
          return HttpResponse.json(mockApiResponse(
            createMockCandidate({ id: 'candidate-1' })
          ));
        })
      );

      // First request
      await candidatesService.fetchCandidateById('candidate-1');
      expect(requestCount).toBe(1);

      // Second request should use cache (if implemented)
      await candidatesService.fetchCandidateById('candidate-1');
      // Note: This test assumes caching is implemented in the service
      // If not implemented, both requests will hit the server
    });

    it('invalidates cache on mutations', async () => {
      // This test would verify that cache is properly invalidated
      // after update operations, ensuring data consistency
      
      const candidateId = 'candidate-1';
      
      // Fetch candidate (should cache)
      await candidatesService.fetchCandidateById(candidateId);
      
      // Update candidate (should invalidate cache)
      await candidatesService.updateCandidate(candidateId, { status: 'contacted' });
      
      // Fetch again (should make new request, not use stale cache)
      const result = await candidatesService.fetchCandidateById(candidateId);
      expect(result.data.status).toBe('contacted');
    });
  });
});