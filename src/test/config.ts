import { vi } from 'vitest';

// Test configuration constants
export const TEST_CONFIG = {
  // Timeouts
  DEFAULT_TIMEOUT: 5000,
  ASYNC_TIMEOUT: 10000,
  ANIMATION_TIMEOUT: 1000,
  
  // API endpoints
  API_BASE_URL: 'http://localhost:8000',
  WS_URL: 'ws://localhost:8000/ws',
  
  // Test data limits
  MAX_CANDIDATES: 100,
  MAX_JOBS: 50,
  MAX_PIPELINE_RUNS: 20,
  
  // Performance thresholds
  RENDER_TIME_THRESHOLD: 100, // ms
  INTERACTION_TIME_THRESHOLD: 50, // ms
  
  // Accessibility settings
  AXE_CONFIG: {
    rules: {
      'color-contrast': { enabled: false }, // Disabled for test environment
      'aria-allowed-attr': { enabled: true },
      'aria-required-attr': { enabled: true },
      'button-name': { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'label': { enabled: true },
      'link-name': { enabled: true },
    },
  },
};

// Global test utilities
export const TEST_UTILS = {
  // Wait for next tick
  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Wait for animation to complete
  waitForAnimation: (duration = TEST_CONFIG.ANIMATION_TIMEOUT) => 
    new Promise(resolve => setTimeout(resolve, duration)),
  
  // Create a promise that resolves after specified time
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate random test data
  generateId: () => `test-${Math.random().toString(36).substr(2, 9)}`,
  
  // Mock console methods
  mockConsole: () => ({
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  }),
  
  // Restore console methods
  restoreConsole: () => {
    vi.restoreAllMocks();
  },
};

// Test environment setup
export const setupTestEnvironment = () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.VITE_ENVIRONMENT = 'test';
  process.env.VITE_API_BASE_URL = TEST_CONFIG.API_BASE_URL;
  process.env.VITE_WS_URL = TEST_CONFIG.WS_URL;
  process.env.VITE_ENABLE_REAL_TIME = 'false';
  process.env.VITE_ENABLE_ANALYTICS = 'false';
  process.env.VITE_ENABLE_DEBUG = 'false';
  
  // Mock performance API
  if (!global.performance) {
    global.performance = {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      getEntriesByName: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
    } as any;
  }
  
  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
  global.cancelAnimationFrame = vi.fn(id => clearTimeout(id));
  
  // Mock requestIdleCallback
  global.requestIdleCallback = vi.fn(cb => setTimeout(cb, 0));
  global.cancelIdleCallback = vi.fn(id => clearTimeout(id));
};

// Test data generators
export const TEST_DATA_GENERATORS = {
  // Generate test user
  user: (overrides = {}) => ({
    id: TEST_UTILS.generateId(),
    email: 'test@example.com',
    name: 'Test User',
    role: 'recruiter',
    permissions: ['read:candidates', 'write:candidates'],
    ...overrides,
  }),
  
  // Generate test candidate
  candidate: (overrides = {}) => ({
    id: TEST_UTILS.generateId(),
    name: 'John Doe',
    email: 'john@example.com',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    title: 'Software Engineer',
    company: 'Tech Corp',
    location: 'San Francisco, CA',
    skills: ['JavaScript', 'React'],
    experience: 5,
    score: 85,
    status: 'new',
    ...overrides,
  }),
  
  // Generate test job
  job: (overrides = {}) => ({
    id: TEST_UTILS.generateId(),
    title: 'Senior Developer',
    company: 'Tech Corp',
    description: 'We are hiring...',
    requirements: ['5+ years experience'],
    location: 'San Francisco, CA',
    skills: ['JavaScript', 'React'],
    status: 'active',
    ...overrides,
  }),
  
  // Generate test pipeline run
  pipelineRun: (overrides = {}) => ({
    id: TEST_UTILS.generateId(),
    jobId: TEST_UTILS.generateId(),
    status: 'running',
    currentStage: 'discovery',
    candidatesFound: 0,
    startTime: new Date().toISOString(),
    ...overrides,
  }),
};

// Performance testing utilities
export const PERFORMANCE_UTILS = {
  // Measure component render time
  measureRenderTime: async (renderFn: () => Promise<any>) => {
    const start = performance.now();
    await renderFn();
    const end = performance.now();
    return end - start;
  },
  
  // Check if render time is within threshold
  assertRenderPerformance: async (renderFn: () => Promise<any>, threshold = TEST_CONFIG.RENDER_TIME_THRESHOLD) => {
    const renderTime = await PERFORMANCE_UTILS.measureRenderTime(renderFn);
    expect(renderTime).toBeLessThan(threshold);
    return renderTime;
  },
  
  // Measure interaction response time
  measureInteractionTime: async (interactionFn: () => Promise<any>) => {
    const start = performance.now();
    await interactionFn();
    const end = performance.now();
    return end - start;
  },
};

// Error testing utilities
export const ERROR_UTILS = {
  // Create mock error
  createMockError: (message = 'Test error', code = 'TEST_ERROR') => {
    const error = new Error(message);
    (error as any).code = code;
    return error;
  },
  
  // Create network error
  createNetworkError: () => {
    const error = new Error('Network Error');
    (error as any).code = 'NETWORK_ERROR';
    return error;
  },
  
  // Create validation error
  createValidationError: (field = 'test', message = 'Invalid value') => {
    const error = new Error('Validation Error');
    (error as any).code = 'VALIDATION_ERROR';
    (error as any).field = field;
    (error as any).details = { [field]: message };
    return error;
  },
};

// Initialize test environment
setupTestEnvironment();