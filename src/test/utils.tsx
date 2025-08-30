import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore, Store } from '@reduxjs/toolkit';
import { vi } from 'vitest';

// Import your store slices
import authSlice from '@/store/slices/authSlice';
import candidatesSlice from '@/store/slices/candidatesSlice';
import jobsSlice from '@/store/slices/jobsSlice';
import pipelineSlice from '@/store/slices/pipelineSlice';
import uiSlice from '@/store/slices/uiSlice';

// Mock data types
export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'recruiter' | 'viewer';
  permissions: string[];
}

export interface MockCandidate {
  id: string;
  name: string;
  email?: string;
  linkedinUrl: string;
  title: string;
  company: string;
  location: string;
  skills: string[];
  experience: number;
  score: number;
  status: 'new' | 'contacted' | 'responded' | 'interested' | 'not_interested';
}

export interface MockJob {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location: string;
  skills: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
}

// Mock data generators
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'recruiter',
  permissions: ['read:candidates', 'write:candidates', 'read:jobs', 'write:jobs'],
  ...overrides,
});

export const createMockCandidate = (overrides: Partial<MockCandidate> = {}): MockCandidate => ({
  id: `candidate-${Math.random().toString(36).substr(2, 9)}`,
  name: 'John Doe',
  email: 'john.doe@example.com',
  linkedinUrl: 'https://linkedin.com/in/johndoe',
  title: 'Software Engineer',
  company: 'Tech Corp',
  location: 'San Francisco, CA',
  skills: ['JavaScript', 'React', 'Node.js'],
  experience: 5,
  score: 85,
  status: 'new',
  ...overrides,
});

export const createMockJob = (overrides: Partial<MockJob> = {}): MockJob => ({
  id: `job-${Math.random().toString(36).substr(2, 9)}`,
  title: 'Senior Software Engineer',
  company: 'Tech Corp',
  description: 'We are looking for a senior software engineer...',
  requirements: ['5+ years experience', 'React expertise', 'Team leadership'],
  location: 'San Francisco, CA',
  skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
  status: 'active',
  ...overrides,
});

// Create test store
export const createTestStore = (preloadedState: any = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      candidates: candidatesSlice,
      jobs: jobsSlice,
      pipeline: pipelineSlice,
      ui: uiSlice,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }),
  });
};

// Create test query client
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: any;
  store?: Store;
  queryClient?: QueryClient;
  initialEntries?: string[];
}

export const renderWithProviders = (
  ui: ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    queryClient = createTestQueryClient(),
    initialEntries = ['/'],
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult & { store: Store; queryClient: QueryClient } => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store,
    queryClient,
  };
};

// Mock API responses
export const mockApiResponse = <T,>(data: T, success = true, message?: string) => ({
  data,
  success,
  message,
  errors: success ? [] : ['Mock error'],
});

// Mock fetch responses
export const mockFetch = (response: any, status = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response)),
    headers: new Headers(),
  });
};

// Mock localStorage helpers
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get store() {
      return { ...store };
    },
  };
};

// Mock WebSocket
export const mockWebSocket = () => {
  const listeners: Record<string, Function[]> = {};
  
  return {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn((event: string, callback: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
    }),
    removeEventListener: vi.fn((event: string, callback: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
      }
    }),
    readyState: 1, // OPEN
    emit: (event: string, data?: any) => {
      if (listeners[event]) {
        listeners[event].forEach(callback => callback({ data }));
      }
    },
  };
};

// Accessibility testing helpers
export const axeMatchers = {
  toHaveNoViolations: (received: any) => {
    const violations = received.violations || [];
    const pass = violations.length === 0;
    
    if (pass) {
      return {
        message: () => 'Expected element to have accessibility violations',
        pass: true,
      };
    } else {
      return {
        message: () => 
          `Expected element to have no accessibility violations, but found ${violations.length}:\n` +
          violations.map((v: any) => `- ${v.description}`).join('\n'),
        pass: false,
      };
    }
  },
};

// Wait for async operations
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

// Mock intersection observer
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  
  window.IntersectionObserver = mockIntersectionObserver;
  return mockIntersectionObserver;
};

// Mock resize observer
export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  
  window.ResizeObserver = mockResizeObserver;
  return mockResizeObserver;
};

// User event helpers
export const createUserEvent = async () => {
  const { userEvent } = await import('@testing-library/user-event');
  return userEvent.setup();
};

// Form testing helpers
export const fillForm = async (fields: Record<string, string>) => {
  const user = await createUserEvent();
  
  for (const [name, value] of Object.entries(fields)) {
    const field = document.querySelector(`[name="${name}"]`) as HTMLElement;
    if (field) {
      await user.clear(field);
      await user.type(field, value);
    }
  }
};

// Component testing helpers
export const getByTestId = (testId: string) => {
  return document.querySelector(`[data-testid="${testId}"]`);
};

export const getAllByTestId = (testId: string) => {
  return Array.from(document.querySelectorAll(`[data-testid="${testId}"]`));
};

// Mock timer helpers
export const mockTimers = () => {
  vi.useFakeTimers();
  return {
    advanceTimersByTime: vi.advanceTimersByTime,
    runAllTimers: vi.runAllTimers,
    runOnlyPendingTimers: vi.runOnlyPendingTimers,
    restore: vi.useRealTimers,
  };
};

// Error boundary testing
export const TestErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return <div data-testid="error-boundary">Something went wrong</div>;
  }
  
  return <>{children}</>;
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { vi } from 'vitest';