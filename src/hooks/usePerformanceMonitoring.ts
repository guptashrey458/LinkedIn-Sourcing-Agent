import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { performanceMonitor, usePerformanceMonitor } from '../utils/performance';
import { queryUtils } from '../services/queryClient';

export interface PerformanceHookOptions {
  trackPageViews?: boolean;
  trackUserInteractions?: boolean;
  enableSmartPrefetch?: boolean;
  reportInterval?: number;
}

export const usePerformanceMonitoring = (options: PerformanceHookOptions = {}) => {
  const {
    trackPageViews = true,
    trackUserInteractions = true,
    enableSmartPrefetch = true,
    reportInterval = 60000, // 1 minute
  } = options;

  const location = useLocation();
  const lastReportTime = useRef(Date.now());
  const pageLoadTime = useRef(Date.now());
  const monitor = usePerformanceMonitor();

  // Track page views and navigation performance
  useEffect(() => {
    if (!trackPageViews) return;

    const navigationStart = Date.now();
    pageLoadTime.current = navigationStart;

    // Track page load time
    const trackPageLoad = () => {
      const loadTime = Date.now() - navigationStart;
      performanceMonitor.recordMetric({
        name: `page-load-${location.pathname}`,
        duration: loadTime,
        timestamp: navigationStart,
        type: 'navigation',
        details: {
          pathname: location.pathname,
          search: location.search,
        },
      });
    };

    // Track when page is fully loaded
    if (document.readyState === 'complete') {
      trackPageLoad();
    } else {
      window.addEventListener('load', trackPageLoad);
      return () => window.removeEventListener('load', trackPageLoad);
    }
  }, [location.pathname, trackPageViews]);

  // Smart prefetching based on current route
  useEffect(() => {
    if (!enableSmartPrefetch) return;

    const prefetchTimer = setTimeout(() => {
      queryUtils.smartPrefetch(location.pathname);
    }, 1000); // Delay to avoid interfering with current page load

    return () => clearTimeout(prefetchTimer);
  }, [location.pathname, enableSmartPrefetch]);

  // Track user interactions
  useEffect(() => {
    if (!trackUserInteractions) return;

    const trackClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const className = target.className;
      const id = target.id;

      performanceMonitor.recordMetric({
        name: 'user-interaction',
        duration: 0,
        timestamp: Date.now(),
        type: 'custom',
        details: {
          type: 'click',
          tagName,
          className,
          id,
          pathname: location.pathname,
        },
      });
    };

    const trackKeyPress = (event: KeyboardEvent) => {
      // Only track meaningful key presses
      if (event.key === 'Enter' || event.key === 'Escape' || event.key === 'Tab') {
        performanceMonitor.recordMetric({
          name: 'user-interaction',
          duration: 0,
          timestamp: Date.now(),
          type: 'custom',
          details: {
            type: 'keypress',
            key: event.key,
            pathname: location.pathname,
          },
        });
      }
    };

    document.addEventListener('click', trackClick);
    document.addEventListener('keydown', trackKeyPress);

    return () => {
      document.removeEventListener('click', trackClick);
      document.removeEventListener('keydown', trackKeyPress);
    };
  }, [trackUserInteractions, location.pathname]);

  // Periodic performance reporting
  useEffect(() => {
    const reportPerformance = () => {
      const now = Date.now();
      const timeSinceLastReport = now - lastReportTime.current;

      if (timeSinceLastReport >= reportInterval) {
        const metrics = monitor.getMetrics();
        const webVitals = monitor.getWebVitals();
        
        // Log performance data (in production, send to analytics service)
        if (process.env.NODE_ENV === 'development') {
          console.group('Performance Report');
          console.log('Metrics:', metrics.slice(-10)); // Last 10 metrics
          console.log('Web Vitals:', webVitals);
          console.log('Memory Usage:', getMemoryUsage());
          console.groupEnd();
        }

        lastReportTime.current = now;
      }
    };

    const interval = setInterval(reportPerformance, reportInterval);
    return () => clearInterval(interval);
  }, [reportInterval, monitor]);

  // Measure component render time
  const measureRender = useCallback((componentName: string) => {
    return monitor.startMeasure(`render-${componentName}`);
  }, [monitor]);

  // Measure async operations
  const measureAsync = useCallback(async <T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    return monitor.measureAsyncFunction(name, operation);
  }, [monitor]);

  // Get current performance stats
  const getStats = useCallback(() => {
    return {
      metrics: monitor.getMetrics(),
      webVitals: monitor.getWebVitals(),
      memoryUsage: getMemoryUsage(),
      pageLoadTime: Date.now() - pageLoadTime.current,
    };
  }, [monitor]);

  return {
    measureRender,
    measureAsync,
    getStats,
    ...monitor,
  };
};

// Memory usage helper
const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100),
    };
  }
  return null;
};

// Hook for measuring component performance
export const useComponentPerformance = (componentName: string) => {
  const { measureRender } = usePerformanceMonitoring();
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const stopMeasure = measureRender(`${componentName}-render-${renderCount.current}`);
    
    return stopMeasure;
  });

  return {
    renderCount: renderCount.current,
  };
};

// Hook for measuring API call performance
export const useAPIPerformance = () => {
  const { measureAsync } = usePerformanceMonitoring();

  const measureAPICall = useCallback(async <T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    return measureAsync(`api-${endpoint}`, apiCall);
  }, [measureAsync]);

  return { measureAPICall };
};