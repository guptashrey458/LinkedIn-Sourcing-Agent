import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Setup MSW worker for browser environment (development)
export const worker = setupWorker(...handlers);

// Start the worker in development mode
if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true') {
  worker.start({
    onUnhandledRequest: 'bypass',
  });
}