// jest.setup.ts
import '@testing-library/jest-dom'

// Mock fetch globally for all tests
global.fetch = jest.fn()

// Suppress React act warnings in tests
// These warnings occur when state updates happen outside of act() calls
// which is common in complex async components with WebSocket and API calls
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to') &&
      args[0].includes('was not wrapped in act')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});