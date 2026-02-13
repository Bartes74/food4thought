import '@testing-library/jest-dom';

// Mock window.scrollTo
if (typeof global.scrollTo === 'undefined') {
  global.scrollTo = () => {};
}

// Suppress console warnings in tests during test runs
if (process.env.NODE_ENV === 'test') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Warning')) {
      return; // Suppress React warnings in tests
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Warning')) {
      return; // Suppress React errors in tests
    }
    originalError.apply(console, args);
  };
}