export default {
  testEnvironment: 'jsdom',
  testTimeout: 30000,
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  globals: {
    jest: true
  },
  testMatch: [
    '**/src/client/**/?(*.)+(spec|test).js',
    '**/src/client/**/?(*.)+(spec|test).jsx',
    '!**/src/client/__tests__/e2e/**'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/client/setupTests.js'
  ],
  collectCoverageFrom: [
    'src/client/**/*.{js,jsx}',
    '!src/client/**/*.test.{js,jsx}',
    '!src/client/**/*.spec.{js,jsx}',
    '!src/client/main.jsx',
    '!src/client/**/__tests__/**',
    '!src/client/**/__mocks__/**'
  ],
  coverageDirectory: 'coverage-frontend',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/client/$1'
  },
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(axios|node-fetch|fetch-blob)/)'
  ],
  detectOpenHandles: true,
  forceExit: true
};