import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { config } from './utils/config';
import { Layout } from './components/layout';
import { ToastContainer } from './components/ui';
import { ThemeProvider } from './contexts';
import realTimeService from './services/realTimeService';
import { performanceMonitor, logBundleSize } from './utils/performance';
import { serviceWorkerManager } from './utils/serviceWorker';

// Lazy load page components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const Candidates = lazy(() => import('./pages/Candidates'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const CrewAIDemo = lazy(() => import('./pages/CrewAIDemo'));
const LinkedInSourcing = lazy(() => import('./components/linkedin/LinkedInDashboard'));

// Temporary placeholder components for unimplemented pages
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-center min-h-full bg-gray-50 dark:bg-gray-900 p-8">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{title}</h1>
      <p className="text-gray-600 dark:text-gray-400">This page will be implemented in subsequent tasks.</p>
    </div>
  </div>
);

// Loading component for lazy loading
const PageLoading: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Suspense fallback for route loading
const RouteFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-full p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading page...</p>
    </div>
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  // Initialize theme from system preference or localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('linkedin-sourcing-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldUseDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
    
    if (shouldUseDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Initialize real-time services
  useEffect(() => {
    if (config.features.realTimeUpdates) {
      realTimeService.initialize();
    }
    
    // Cleanup on unmount
    return () => {
      if (realTimeService.isInitialized()) {
        realTimeService.destroy();
      }
    };
  }, []);
  
  // Log configuration and performance info in development
  useEffect(() => {
    if (config.environment === 'development' && config.features.debug) {
      console.log('App initialized with config:', config);
      logBundleSize();
    }
  }, []);

  // Initialize service worker
  useEffect(() => {
    serviceWorkerManager.register({
      onSuccess: () => {
        console.log('Service worker registered successfully');
      },
      onUpdate: () => {
        console.log('New content available, please refresh');
        // You could show a toast notification here
      },
      onOfflineReady: () => {
        console.log('App ready for offline use');
      },
    });
  }, []);

  // Cleanup performance monitor on unmount
  useEffect(() => {
    return () => {
      performanceMonitor.destroy();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Suspense fallback={<PageLoading />}>
          {/* Toast Notifications */}
          <ToastContainer position="top-right" maxToasts={3} />
          
          <Routes>
            {/* Auth routes (without layout) */}
            <Route path="/login" element={
              <Suspense fallback={<RouteFallback />}>
                <Login />
              </Suspense>
            } />
            
            {/* Main application routes (with layout) */}
            <Route path="/*" element={
              <Layout>
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    {/* Default route - redirect to CrewAI demo for showcase */}
                    <Route path="/" element={<Navigate to="/demo" replace />} />
                    
                    {/* CrewAI Demo - main showcase */}
                    <Route path="/demo" element={<CrewAIDemo />} />
                    
                    {/* Main application routes */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/jobs/create" element={<PlaceholderPage title="Create Job" />} />
                    <Route path="/jobs/:id/edit" element={<PlaceholderPage title="Edit Job" />} />
                    <Route path="/candidates" element={<Candidates />} />
                    <Route path="/candidates/:id" element={<PlaceholderPage title="Candidate Details" />} />
                    <Route path="/pipeline" element={<Pipeline />} />
                    <Route path="/pipeline/:id" element={<PlaceholderPage title="Pipeline Details" />} />
                    <Route path="/linkedin-sourcing" element={<LinkedInSourcing />} />
                    <Route path="/analytics" element={<PlaceholderPage title="Analytics" />} />
                    <Route path="/settings" element={<Settings />} />
                    
                    {/* Catch all route */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
              </Layout>
            } />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;