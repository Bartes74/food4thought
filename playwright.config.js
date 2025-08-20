import { defineConfig, devices } from '@playwright/test';

// Re-export konfiguracji z katalogu e2e
export default defineConfig({
  testDir: './src/client/__tests__/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3001',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Szybkie timeouty dla lepszej wydajności */
    actionTimeout: 10000,
    navigationTimeout: 15000,
    
    /* Screenshot tylko przy błędach */
    screenshot: 'only-on-failure',
    
    /* Video tylko przy błędach */
    video: 'retain-on-failure',
  },

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'echo "Server already running"',
  //   url: 'http://localhost:3001',
  //   reuseExistingServer: true,
  //   timeout: 120 * 1000,
  // },
  
  /* Optymalizacje dla szybkości */
  timeout: 60000, // Zwiększamy timeout z 30s do 60s
  expect: {
    timeout: 15000, // Zwiększamy timeout dla expect z 10s do 15s
  },
  
  /* Globalne setup */
  globalSetup: './src/client/__tests__/e2e/global-setup.js',
  
  /* Projekty z zapisaną sesją */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/admin.json',
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/admin.json',
      },
    },
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/admin.json',
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        storageState: 'playwright/.auth/admin.json',
      },
    },
  ],
});
