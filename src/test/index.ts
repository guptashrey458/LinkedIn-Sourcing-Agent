// Export all testing utilities for easy importing
export * from './utils';
export * from './config';
export * from './accessibility';
export * from './mocks/handlers';
export * from './mocks/server';
export * from './mocks/browser';

// Re-export commonly used testing library functions
export {
  render,
  screen,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
  within,
  getByRole,
  getByText,
  getByLabelText,
  getByTestId,
  queryByRole,
  queryByText,
  queryByLabelText,
  queryByTestId,
  findByRole,
  findByText,
  findByLabelText,
  findByTestId,
} from '@testing-library/react';

export { userEvent } from '@testing-library/user-event';
export { vi, expect, describe, it, test, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';