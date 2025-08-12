import { chromium } from '@playwright/test';

async function globalSetup(config) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Go to login page
  await page.goto('http://localhost:3000/login');
  
  // Wait for login form and login
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'admin@food4thought.local');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  // Wait for successful login and navigation to main page
  await page.waitForURL('http://localhost:3000/');
  await page.waitForSelector('header');
  
  // Save authentication state
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
  
  await browser.close();
}

export default globalSetup; 