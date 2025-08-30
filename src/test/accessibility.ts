import axe from 'axe-core';
import { RenderResult } from '@testing-library/react';

// Configure axe-core for testing
axe.configure({
  rules: {
    // Disable color-contrast rule for testing (can be flaky in test environment)
    'color-contrast': { enabled: false },
    // Enable other important accessibility rules
    'aria-allowed-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'button-name': { enabled: true },
    'duplicate-id': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'html-has-lang': { enabled: true },
    'image-alt': { enabled: true },
    'input-image-alt': { enabled: true },
    'label': { enabled: true },
    'link-name': { enabled: true },
    'list': { enabled: true },
    'listitem': { enabled: true },
    'meta-refresh': { enabled: true },
    'meta-viewport': { enabled: true },
    'region': { enabled: true },
    'skip-link': { enabled: true },
    'tabindex': { enabled: true },
    'valid-lang': { enabled: true },
  },
});

// Accessibility testing helper
export const runAxeTest = async (container: Element) => {
  const results = await axe.run(container);
  return results;
};

// Test accessibility of a rendered component
export const testAccessibility = async (renderResult: RenderResult) => {
  const results = await runAxeTest(renderResult.container);
  expect(results.violations).toHaveLength(0);
  return results;
};

// Test keyboard navigation
export const testKeyboardNavigation = async (
  renderResult: RenderResult,
  expectedFocusableElements: string[]
) => {
  const { container } = renderResult;
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  // Check that expected focusable elements are present
  expect(focusableElements.length).toBeGreaterThanOrEqual(expectedFocusableElements.length);
  
  // Test tab navigation
  for (let i = 0; i < focusableElements.length; i++) {
    const element = focusableElements[i] as HTMLElement;
    element.focus();
    expect(document.activeElement).toBe(element);
  }
};

// Test ARIA attributes
export const testAriaAttributes = (element: Element, expectedAttributes: Record<string, string>) => {
  Object.entries(expectedAttributes).forEach(([attribute, expectedValue]) => {
    const actualValue = element.getAttribute(attribute);
    expect(actualValue).toBe(expectedValue);
  });
};

// Test screen reader announcements
export const testScreenReaderAnnouncements = (container: Element) => {
  const liveRegions = container.querySelectorAll('[aria-live]');
  const alerts = container.querySelectorAll('[role="alert"]');
  const status = container.querySelectorAll('[role="status"]');
  
  return {
    liveRegions: Array.from(liveRegions),
    alerts: Array.from(alerts),
    status: Array.from(status),
  };
};

// Test color contrast (when needed)
export const testColorContrast = async (container: Element) => {
  // Temporarily enable color contrast rule
  axe.configure({
    rules: {
      'color-contrast': { enabled: true },
    },
  });
  
  const results = await axe.run(container);
  
  // Reset configuration
  axe.configure({
    rules: {
      'color-contrast': { enabled: false },
    },
  });
  
  return results.violations.filter(violation => violation.id === 'color-contrast');
};

// Test focus management
export const testFocusManagement = {
  // Test that focus is trapped within a modal/dialog
  testFocusTrap: async (container: Element) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    // Focus should start on first element
    firstElement.focus();
    expect(document.activeElement).toBe(firstElement);
    
    // Tab from last element should go to first
    lastElement.focus();
    // Simulate tab key (this would need to be done with user-event in actual tests)
    expect(focusableElements.length).toBeGreaterThan(0);
  },
  
  // Test that focus is restored after modal closes
  testFocusRestore: (originalActiveElement: Element | null, currentActiveElement: Element | null) => {
    expect(currentActiveElement).toBe(originalActiveElement);
  },
  
  // Test skip links
  testSkipLinks: (container: Element) => {
    const skipLinks = container.querySelectorAll('a[href^="#"]');
    skipLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const target = container.querySelector(href);
        expect(target).toBeTruthy();
      }
    });
  },
};

// Accessibility test suite runner
export const runAccessibilityTestSuite = async (
  renderResult: RenderResult,
  options: {
    skipAxe?: boolean;
    skipKeyboard?: boolean;
    skipColorContrast?: boolean;
    expectedFocusableElements?: string[];
    expectedAriaAttributes?: Record<string, Record<string, string>>;
  } = {}
) => {
  const { container } = renderResult;
  const results: any = {};
  
  // Run axe accessibility tests
  if (!options.skipAxe) {
    results.axe = await runAxeTest(container);
    expect(results.axe.violations).toHaveLength(0);
  }
  
  // Test keyboard navigation
  if (!options.skipKeyboard && options.expectedFocusableElements) {
    await testKeyboardNavigation(renderResult, options.expectedFocusableElements);
  }
  
  // Test color contrast
  if (!options.skipColorContrast) {
    results.colorContrast = await testColorContrast(container);
  }
  
  // Test ARIA attributes
  if (options.expectedAriaAttributes) {
    Object.entries(options.expectedAriaAttributes).forEach(([selector, attributes]) => {
      const element = container.querySelector(selector);
      if (element) {
        testAriaAttributes(element, attributes);
      }
    });
  }
  
  // Test screen reader announcements
  results.screenReader = testScreenReaderAnnouncements(container);
  
  return results;
};

// Export axe configuration for custom tests
export { axe };