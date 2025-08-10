// Global test setup
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for TextEncoder/TextDecoder in Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally exit with a non-zero code to fail the test run
  // process.exit(1);
});

// Export a test environment setup function that will be called by Jest
export default function setupTestEnvironment() {
  // This function will be called by Jest's setupFilesAfterEnv
  // All test suites will have access to anything set up here
  
  // Set a longer timeout for all tests (30 seconds)
  jest.setTimeout(30000);
  
  // Global beforeAll hook to run before all tests
  beforeAll(async () => {
    // Any global setup can go here
    console.log('Global test setup complete');
  });

  // Global afterAll hook to run after all tests
  afterAll(async () => {
    // Any global teardown can go here
    console.log('Global test teardown complete');
  });
}
