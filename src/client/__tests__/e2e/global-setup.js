import { chromium } from '@playwright/test';

async function globalSetup(config) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Go to login page
    await page.goto('http://localhost:3001/login');
    
    // Wait for login form and login
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });
    await page.fill('input[type="email"]', 'admin@food4thought.local');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for successful login and main content, be tolerant to redirects/layout
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForSelector('header, main', { timeout: 30000 });
    
    // Wait for loading to complete (if exists)
    try {
      await page.waitForSelector('text=Ładowanie...', { state: 'hidden', timeout: 10000 });
    } catch (e) {
      console.log('Loading indicator not found or already hidden');
    }
    
    // Save authentication state
    await page.context().storageState({ path: 'playwright/.auth/admin.json' });
    
    console.log('Global setup completed successfully');
  } catch (error) {
    console.error('Global setup failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup; 