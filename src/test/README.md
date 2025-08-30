# Testing Infrastructure Documentation

This document provides an overview of the comprehensive testing infrastructure implemented for the LinkedIn Sourcing Agent frontend application.

## Overview

The testing infrastructure includes:
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: Redux slices and API service testing  
- **Accessibility Tests**: WCAG compliance and screen reader support
- **End-to-End Tests**: Complete user workflow testing
- **Performance Tests**: Render time and interaction benchmarks
- **Coverage Reporting**: Comprehensive code coverage analysis

## Technology Stack

| Tool | Purpose | Version |
|------|---------|---------|
| **Vitest** | Test runner and framework | 3.2.4+ |
| **React Testing Library** | Component testing utilities | 16.3.0+ |
| **@testing-library/user-event** | User interaction simulation | 14.6.1+ |
| **@testing-library/jest-dom** | DOM testing matchers | 6.8.0+ |
| **MSW (Mock Service Worker)** | API mocking | Latest |
| **axe-core** | Accessibility testing | Latest |
| **@vitest/coverage-v8** | Coverage reporting | Latest |

## Project Structure

```
src/test/
├── __tests__/                 # Global test files
├── mocks/                     # Mock data and handlers
│   ├── handlers.ts           # MSW request handlers
│   ├── server.ts             # Node.js MSW server setup
│   └── browser.ts            # Browser MSW worker setup
├── accessibility.ts          # Accessibility testing utilities
├── config.ts                 # Test configuration and constants
├── utils.tsx                 # Testing utilities and helpers
├── setup.ts                  # Global test setup
├── run-tests.ts              # Test runner script
├── basic.test.ts             # Basic infrastructure tests
└── index.ts                  # Main exports
```

## Test Categories

### 1. Unit Tests (`*.test.{ts,tsx}`)

**Purpose**: Test individual components and functions in isolation.

**Examples**:
- `src/components/ui/__tests__/Button.simple.test.tsx`
- Component prop handling
- Event callbacks
- State changes
- Utility functions

**Running**:
```bash
npm run test:unit
```

### 2. Integration Tests (`*.integration.test.{ts,tsx}`)

**Purpose**: Test interactions between multiple components or systems.

**Examples**:
- `src/store/slices/__tests__/candidatesSlice.integration.test.ts`
- `src/services/__tests__/candidatesService.integration.test.ts`
- Redux store interactions
- API service calls
- Data flow between components

**Running**:
```bash
npm run test:integration
```

### 3. Accessibility Tests (`*.accessibility.test.{ts,tsx}`)

**Purpose**: Ensure WCAG compliance and screen reader compatibility.

**Examples**:
- `src/components/ui/__tests__/DataTable.accessibility.test.tsx`
- ARIA attributes
- Keyboard navigation
- Focus management
- Color contrast
- Screen reader announcements

**Running**:
```bash
npm run test:accessibility
```

### 4. End-to-End Tests (`*.e2e.test.{ts,tsx}`)

**Purpose**: Test complete user workflows and application behavior.

**Examples**:
- `src/test/e2e/candidate-management.e2e.test.tsx`
- User authentication flow
- Candidate discovery and management
- Job creation and editing
- Pipeline monitoring
- Data export workflows

**Running**:
```bash
npm run test:e2e
```

## Testing Utilities

### Core Utilities (`src/test/utils.tsx`)

#### `renderWithProviders()`
Renders components with all necessary providers (Redux, React Query, Router).

```typescript
const { getByRole, store, queryClient } = renderWithProviders(
  <MyComponent />,
  {
    preloadedState: { auth: { user: mockUser } },
    initialEntries: ['/candidates']
  }
);
```

#### Mock Data Generators
```typescript
const mockUser = createMockUser({ role: 'admin' });
const mockCandidate = createMockCandidate({ score: 95 });
const mockJob = createMockJob({ status: 'active' });
```

#### API Mocking
```typescript
mockFetch(mockApiResponse(mockCandidates));
mockWebSocket().emit('pipeline-update', data);
```

### Accessibility Utilities (`src/test/accessibility.ts`)

#### `testAccessibility()`
Runs comprehensive accessibility tests using axe-core.

```typescript
const renderResult = renderWithProviders(<MyComponent />);
await testAccessibility(renderResult);
```

#### `runAccessibilityTestSuite()`
Runs complete accessibility test suite with customizable options.

```typescript
await runAccessibilityTestSuite(renderResult, {
  expectedFocusableElements: ['button', 'input'],
  expectedAriaAttributes: {
    'table': { 'role': 'table', 'aria-label': 'Data table' }
  }
});
```

### Performance Testing

#### Render Performance
```typescript
const renderTime = await PERFORMANCE_UTILS.measureRenderTime(async () => {
  renderWithProviders(<ExpensiveComponent />);
});
expect(renderTime).toBeLessThan(100); // ms
```

#### Interaction Performance
```typescript
const interactionTime = await PERFORMANCE_UTILS.measureInteractionTime(async () => {
  await user.click(button);
});
```

## Mock Service Worker (MSW)

### API Mocking
MSW provides realistic API mocking for both development and testing.

**Handlers** (`src/test/mocks/handlers.ts`):
- Authentication endpoints
- CRUD operations for candidates, jobs, pipelines
- Search and filtering
- Export functionality
- Error simulation

**Usage in Tests**:
```typescript
// Override default handler for specific test
server.use(
  http.get('/api/candidates', () => {
    return HttpResponse.json(mockApiResponse([]));
  })
);
```

### WebSocket Mocking
```typescript
const mockWs = mockWebSocket();
mockWs.emit('pipeline-update', { stage: 'completed' });
```

## Coverage Reporting

### Configuration
Coverage is configured in `vite.config.ts` with:
- **Provider**: V8 (fast and accurate)
- **Reporters**: Text, JSON, HTML, LCOV
- **Thresholds**: 80% for branches, functions, lines, statements
- **Exclusions**: Test files, config files, type definitions

### Running Coverage
```bash
# Full coverage report
npm run test:coverage

# Coverage for specific files
npm run test:coverage -- src/components/ui/

# HTML report (opens in browser)
npm run test:coverage && open coverage/index.html
```

### Coverage Thresholds
```typescript
thresholds: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

## Test Scripts

### Available Scripts
```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage",
  "test:watch": "vitest --watch",
  "test:accessibility": "vitest run --reporter=verbose src/**/*.accessibility.test.{ts,tsx}",
  "test:integration": "vitest run --reporter=verbose src/**/*.integration.test.{ts,tsx}",
  "test:unit": "vitest run --reporter=verbose src/**/*.test.{ts,tsx} --exclude src/**/*.integration.test.{ts,tsx} --exclude src/**/*.accessibility.test.{ts,tsx}"
}
```

### Custom Test Runner
Use `src/test/run-tests.ts` for advanced test execution:

```bash
# Run specific test types
npm run test:script unit
npm run test:script integration --verbose
npm run test:script accessibility
npm run test:script e2e
npm run test:script all
npm run test:script coverage
```

## Best Practices

### Test Organization
1. **Co-location**: Place test files next to the code they test
2. **Naming**: Use descriptive test names that explain the expected behavior
3. **Structure**: Group related tests using `describe` blocks
4. **Setup**: Use `beforeEach` for test setup, `afterEach` for cleanup

### Writing Tests
1. **AAA Pattern**: Arrange, Act, Assert
2. **Single Responsibility**: Each test should verify one behavior
3. **Isolation**: Tests should not depend on each other
4. **Realistic Data**: Use mock data that resembles real application data

### Accessibility Testing
1. **Semantic HTML**: Test that components use proper semantic elements
2. **ARIA Labels**: Verify all interactive elements have accessible names
3. **Keyboard Navigation**: Test tab order and keyboard interactions
4. **Focus Management**: Ensure focus is properly managed in modals and dynamic content

### Performance Testing
1. **Render Time**: Components should render within acceptable time limits
2. **Memory Usage**: Watch for memory leaks in long-running tests
3. **Interaction Response**: User interactions should be responsive

## Continuous Integration

### GitHub Actions (Example)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:accessibility
      - run: npm run test:coverage
```

### Coverage Reporting
- Upload coverage reports to services like Codecov or Coveralls
- Set up coverage gates in CI/CD pipeline
- Monitor coverage trends over time

## Troubleshooting

### Common Issues

#### MSW Not Working
```typescript
// Ensure MSW server is started in test setup
import { server } from '@/test/mocks/server';
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

#### Accessibility Tests Failing
```typescript
// Check for proper ARIA attributes
expect(element).toHaveAttribute('aria-label', 'Expected label');

// Verify focus management
element.focus();
expect(element).toHaveFocus();
```

#### Async Tests Timing Out
```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Increase timeout for slow operations
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Debugging Tests
1. **Use `screen.debug()`** to see current DOM state
2. **Add `console.log`** statements for debugging
3. **Use Vitest UI** for interactive debugging: `npm run test:ui`
4. **Check browser console** for JavaScript errors

## Future Enhancements

### Planned Improvements
1. **Visual Regression Testing**: Add screenshot comparison tests
2. **Performance Monitoring**: Integrate with performance monitoring tools
3. **Cross-browser Testing**: Add browser compatibility tests
4. **Mobile Testing**: Add responsive design tests
5. **Load Testing**: Add tests for handling large datasets

### Tools to Consider
- **Playwright**: For more robust E2E testing
- **Storybook**: For component documentation and testing
- **Chromatic**: For visual regression testing
- **Lighthouse CI**: For performance auditing

## Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)

### Best Practices
- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

This testing infrastructure provides a solid foundation for maintaining code quality, ensuring accessibility compliance, and preventing regressions as the application grows.