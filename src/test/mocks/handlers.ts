import { http, HttpResponse } from 'msw';
import { createMockUser, createMockCandidate, createMockJob, mockApiResponse } from '../utils';

// Mock data
const mockUsers = [
  createMockUser({ id: 'user-1', name: 'John Doe', email: 'john@example.com' }),
  createMockUser({ id: 'user-2', name: 'Jane Smith', email: 'jane@example.com', role: 'admin' }),
];

const mockCandidates = Array.from({ length: 50 }, (_, i) => 
  createMockCandidate({
    id: `candidate-${i + 1}`,
    name: `Candidate ${i + 1}`,
    email: `candidate${i + 1}@example.com`,
    score: Math.floor(Math.random() * 40) + 60, // 60-100
    experience: Math.floor(Math.random() * 10) + 1, // 1-10 years
  })
);

const mockJobs = Array.from({ length: 10 }, (_, i) => 
  createMockJob({
    id: `job-${i + 1}`,
    title: `Job Position ${i + 1}`,
    company: `Company ${i + 1}`,
  })
);

const mockPipelineRuns = [
  {
    id: 'pipeline-1',
    jobId: 'job-1',
    status: 'completed',
    currentStage: 'messaging',
    candidatesFound: 25,
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date().toISOString(),
    duration: 3600,
  },
  {
    id: 'pipeline-2',
    jobId: 'job-2',
    status: 'running',
    currentStage: 'scoring',
    candidatesFound: 15,
    startTime: new Date(Date.now() - 1800000).toISOString(),
    duration: null,
  },
];

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as any;
    
    if (email === 'test@example.com' && password === 'password') {
      return HttpResponse.json(mockApiResponse({
        user: mockUsers[0],
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      }));
    }
    
    return HttpResponse.json(
      mockApiResponse(null, false, 'Invalid credentials'),
      { status: 401 }
    );
  }),

  http.post('/api/auth/refresh', () => {
    return HttpResponse.json(mockApiResponse({
      token: 'new-mock-jwt-token',
      refreshToken: 'new-mock-refresh-token',
    }));
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json(mockApiResponse({ success: true }));
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json(mockApiResponse(mockUsers[0]));
  }),

  // Jobs endpoints
  http.get('/api/jobs', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    
    let filteredJobs = mockJobs;
    if (search) {
      filteredJobs = mockJobs.filter(job => 
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);
    
    return HttpResponse.json(mockApiResponse(paginatedJobs, true, undefined));
  }),

  http.get('/api/jobs/:id', ({ params }) => {
    const job = mockJobs.find(j => j.id === params.id);
    if (!job) {
      return HttpResponse.json(
        mockApiResponse(null, false, 'Job not found'),
        { status: 404 }
      );
    }
    return HttpResponse.json(mockApiResponse(job));
  }),

  http.post('/api/jobs', async ({ request }) => {
    const jobData = await request.json() as any;
    const newJob = createMockJob({
      ...jobData,
      id: `job-${Date.now()}`,
    });
    mockJobs.push(newJob);
    return HttpResponse.json(mockApiResponse(newJob), { status: 201 });
  }),

  http.put('/api/jobs/:id', async ({ params, request }) => {
    const jobData = await request.json() as any;
    const jobIndex = mockJobs.findIndex(j => j.id === params.id);
    
    if (jobIndex === -1) {
      return HttpResponse.json(
        mockApiResponse(null, false, 'Job not found'),
        { status: 404 }
      );
    }
    
    mockJobs[jobIndex] = { ...mockJobs[jobIndex], ...jobData };
    return HttpResponse.json(mockApiResponse(mockJobs[jobIndex]));
  }),

  http.delete('/api/jobs/:id', ({ params }) => {
    const jobIndex = mockJobs.findIndex(j => j.id === params.id);
    
    if (jobIndex === -1) {
      return HttpResponse.json(
        mockApiResponse(null, false, 'Job not found'),
        { status: 404 }
      );
    }
    
    mockJobs.splice(jobIndex, 1);
    return HttpResponse.json(mockApiResponse({ success: true }));
  }),

  // Candidates endpoints
  http.get('/api/candidates', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const minScore = parseInt(url.searchParams.get('minScore') || '0');
    const maxScore = parseInt(url.searchParams.get('maxScore') || '100');
    const location = url.searchParams.get('location') || '';
    const skills = url.searchParams.get('skills')?.split(',') || [];
    
    let filteredCandidates = mockCandidates.filter(candidate => {
      const matchesSearch = !search || 
        candidate.name.toLowerCase().includes(search.toLowerCase()) ||
        candidate.title.toLowerCase().includes(search.toLowerCase()) ||
        candidate.company.toLowerCase().includes(search.toLowerCase());
      
      const matchesScore = candidate.score >= minScore && candidate.score <= maxScore;
      
      const matchesLocation = !location || 
        candidate.location.toLowerCase().includes(location.toLowerCase());
      
      const matchesSkills = skills.length === 0 || 
        skills.some(skill => 
          candidate.skills.some(candidateSkill => 
            candidateSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
      
      return matchesSearch && matchesScore && matchesLocation && matchesSkills;
    });
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCandidates = filteredCandidates.slice(startIndex, endIndex);
    
    return HttpResponse.json(mockApiResponse({
      candidates: paginatedCandidates,
      total: filteredCandidates.length,
      page,
      limit,
      hasNext: endIndex < filteredCandidates.length,
      hasPrev: page > 1,
    }));
  }),

  http.get('/api/candidates/:id', ({ params }) => {
    const candidate = mockCandidates.find(c => c.id === params.id);
    if (!candidate) {
      return HttpResponse.json(
        mockApiResponse(null, false, 'Candidate not found'),
        { status: 404 }
      );
    }
    return HttpResponse.json(mockApiResponse(candidate));
  }),

  http.put('/api/candidates/:id', async ({ params, request }) => {
    const candidateData = await request.json() as any;
    const candidateIndex = mockCandidates.findIndex(c => c.id === params.id);
    
    if (candidateIndex === -1) {
      return HttpResponse.json(
        mockApiResponse(null, false, 'Candidate not found'),
        { status: 404 }
      );
    }
    
    mockCandidates[candidateIndex] = { ...mockCandidates[candidateIndex], ...candidateData };
    return HttpResponse.json(mockApiResponse(mockCandidates[candidateIndex]));
  }),

  // Pipeline endpoints
  http.get('/api/pipeline/runs', ({ request }) => {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');
    
    let filteredRuns = mockPipelineRuns;
    if (jobId) {
      filteredRuns = mockPipelineRuns.filter(run => run.jobId === jobId);
    }
    
    return HttpResponse.json(mockApiResponse(filteredRuns));
  }),

  http.get('/api/pipeline/runs/:id', ({ params }) => {
    const run = mockPipelineRuns.find(r => r.id === params.id);
    if (!run) {
      return HttpResponse.json(
        mockApiResponse(null, false, 'Pipeline run not found'),
        { status: 404 }
      );
    }
    return HttpResponse.json(mockApiResponse(run));
  }),

  http.post('/api/pipeline/start', async ({ request }) => {
    const { jobId } = await request.json() as any;
    const newRun = {
      id: `pipeline-${Date.now()}`,
      jobId,
      status: 'running',
      currentStage: 'discovery',
      candidatesFound: 0,
      startTime: new Date().toISOString(),
      duration: null,
    };
    mockPipelineRuns.push(newRun);
    return HttpResponse.json(mockApiResponse(newRun), { status: 201 });
  }),

  http.post('/api/pipeline/stop/:id', ({ params }) => {
    const runIndex = mockPipelineRuns.findIndex(r => r.id === params.id);
    
    if (runIndex === -1) {
      return HttpResponse.json(
        mockApiResponse(null, false, 'Pipeline run not found'),
        { status: 404 }
      );
    }
    
    mockPipelineRuns[runIndex] = {
      ...mockPipelineRuns[runIndex],
      status: 'cancelled',
    };
    
    return HttpResponse.json(mockApiResponse(mockPipelineRuns[runIndex]));
  }),

  // Dashboard/Analytics endpoints
  http.get('/api/dashboard/metrics', () => {
    return HttpResponse.json(mockApiResponse({
      totalCandidates: mockCandidates.length,
      totalJobs: mockJobs.length,
      activePipelines: mockPipelineRuns.filter(r => r.status === 'running').length,
      averageScore: Math.round(mockCandidates.reduce((sum, c) => sum + c.score, 0) / mockCandidates.length),
      successRate: 85,
      responseRate: 42,
    }));
  }),

  http.get('/api/analytics/candidates/distribution', () => {
    return HttpResponse.json(mockApiResponse({
      byScore: [
        { range: '90-100', count: 5 },
        { range: '80-89', count: 15 },
        { range: '70-79', count: 20 },
        { range: '60-69', count: 10 },
      ],
      byLocation: [
        { location: 'San Francisco, CA', count: 20 },
        { location: 'New York, NY', count: 15 },
        { location: 'Seattle, WA', count: 10 },
        { location: 'Austin, TX', count: 5 },
      ],
      bySkills: [
        { skill: 'JavaScript', count: 35 },
        { skill: 'React', count: 30 },
        { skill: 'Node.js', count: 25 },
        { skill: 'Python', count: 20 },
      ],
    }));
  }),

  // Export endpoints
  http.post('/api/export/candidates', async ({ request }) => {
    const { format, candidateIds, fields } = await request.json() as any;
    
    // Simulate export processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return HttpResponse.json(mockApiResponse({
      exportId: `export-${Date.now()}`,
      format,
      status: 'completed',
      downloadUrl: `/api/exports/download/export-${Date.now()}`,
      recordCount: candidateIds?.length || mockCandidates.length,
    }));
  }),

  // Error simulation endpoints for testing error handling
  http.get('/api/test/error/500', () => {
    return HttpResponse.json(
      mockApiResponse(null, false, 'Internal server error'),
      { status: 500 }
    );
  }),

  http.get('/api/test/error/network', () => {
    return HttpResponse.error();
  }),

  http.get('/api/test/slow', async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    return HttpResponse.json(mockApiResponse({ message: 'Slow response' }));
  }),
];