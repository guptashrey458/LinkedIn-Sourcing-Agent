// Service Worker registration and management

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
  onNeedRefresh?: () => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private config: ServiceWorkerConfig = {};

  async register(config: ServiceWorkerConfig = {}) {
    this.config = config;

    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return false;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Service Worker registration skipped in development');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      this.registration = registration;

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content available
              console.log('New content available, please refresh');
              this.config.onUpdate?.(registration);
            } else {
              // Content cached for offline use
              console.log('Content cached for offline use');
              this.config.onSuccess?.(registration);
              this.config.onOfflineReady?.();
            }
          }
        });
      });

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      console.log('Service Worker registered successfully');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async unregister() {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered:', result);
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  async update() {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      console.log('Service Worker update check completed');
      return true;
    } catch (error) {
      console.error('Service Worker update failed:', error);
      return false;
    }
  }

  async skipWaiting() {
    if (!this.registration?.waiting) {
      return false;
    }

    // Send message to service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    return true;
  }

  async clearCache() {
    if (!this.registration?.active) {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success || false);
      };

      this.registration!.active!.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }

  async getVersion(): Promise<string | null> {
    if (!this.registration?.active) {
      return null;
    }

    return new Promise<string | null>((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version || null);
      };

      this.registration!.active!.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );
    });
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  onOnlineStatusChange(callback: (isOnline: boolean) => void) {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

// Create singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// React hook for service worker
export const useServiceWorker = (config: ServiceWorkerConfig = {}) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [needsRefresh, setNeedsRefresh] = React.useState(false);

  React.useEffect(() => {
    // Register service worker
    serviceWorkerManager.register({
      ...config,
      onUpdate: (registration) => {
        setNeedsRefresh(true);
        config.onUpdate?.(registration);
      },
      onSuccess: (registration) => {
        setIsRegistered(true);
        config.onSuccess?.(registration);
      },
    });

    // Listen for online/offline changes
    const cleanup = serviceWorkerManager.onOnlineStatusChange(setIsOnline);

    return cleanup;
  }, []);

  const refreshApp = React.useCallback(async () => {
    await serviceWorkerManager.skipWaiting();
  }, []);

  const clearCache = React.useCallback(async () => {
    return serviceWorkerManager.clearCache();
  }, []);

  return {
    isOnline,
    isRegistered,
    needsRefresh,
    refreshApp,
    clearCache,
    update: serviceWorkerManager.update.bind(serviceWorkerManager),
    unregister: serviceWorkerManager.unregister.bind(serviceWorkerManager),
  };
};

// Offline detection utilities
export const isOffline = (): boolean => !navigator.onLine;

export const waitForOnline = (): Promise<void> => {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve();
      return;
    }

    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };

    window.addEventListener('online', handleOnline);
  });
};

// Cache management utilities
export const cacheManager = {
  async clear() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  },

  async getSize(): Promise<number> {
    if (!('caches' in window) || !('estimate' in navigator.storage)) {
      return 0;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    } catch {
      return 0;
    }
  },

  async getQuota(): Promise<number> {
    if (!('estimate' in navigator.storage)) {
      return 0;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return estimate.quota || 0;
    } catch {
      return 0;
    }
  },
};

// Add React import for the hook
import React from 'react';