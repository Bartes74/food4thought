export default {
  displayName: 'Comprehensive Integration Tests',
  testEnvironment: 'node',
  testTimeout: 60000,
  transform: {},
  globals: {
    jest: true
  },
  testMatch: [
    '**/src/server/__tests__/full-system.integration.test.js',
    '**/src/server/__tests__/episodes.integration.test.js',
    '**/src/server/__tests__/auth.integration.test.js',
    '**/src/server/__tests__/user-stats.integration.test.js',
    '**/src/server/__tests__/adminStats.test.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.js'
  ],
  collectCoverageFrom: [
    'src/server/**/*.js',
    '!src/server/**/*.test.js',
    '!src/server/**/*.spec.js',
    '!src/server/__tests__/**'
  ],
  coverageDirectory: 'coverage-comprehensive',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|fetch-blob)/)'
  ],
  detectOpenHandles: true,
  forceExit: true,
  verbose: true,
  bail: false, // Continue running tests even if some fail
  maxWorkers: 1, // Run tests sequentially for integration tests
  testSequencer: '<rootDir>/test-sequencer.js'
};