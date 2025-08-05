const { chromium } = require('@playwright/test');

async function globalSetup(config) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Pre-login admin user to avoid repeated logins
  await page.goto('http://localhost:3000');
  
  // Wait for login form and login
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'admin@food4thought.local');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  await page.waitForSelector('header');
  
  // Save authentication state
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
  
  await browser.close();
}

module.exports = globalSetup; 