import { test, expect } from '@playwright/test';

test.describe('Panel administratora', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await page.waitForSelector('text=Ładowanie...', { state: 'hidden' });
  });

  test('powinien przejść do panelu administratora', async ({ page }) => {
    await page.click('[data-testid="admin-link"]');
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1:has-text("Panel administracyjny")')).toBeVisible();
  });

  test('powinien wyświetlić informacje o użytkowniku', async ({ page }) => {
    await page.click('[data-testid="admin-link"]');
    await expect(page.locator('h1:has-text("Panel administracyjny")')).toBeVisible();
    // Użyj bardziej precyzyjnego selektora - sprawdź czy email jest w headerze panelu
    await expect(page.locator('h2:has-text("admin@food4thought.local")')).toBeVisible();
  });

  test('powinien wyświetlić opcje użytkownika', async ({ page }) => {
    await page.click('[data-testid="admin-link"]');
    await expect(page.locator('text=Twoje opcje')).toBeVisible();
    await expect(page.locator('text=Mój profil')).toBeVisible();
  });

  test('powinien wyświetlić narzędzia administratora', async ({ page }) => {
    await page.click('[data-testid="admin-link"]');
    await expect(page.locator('text=Narzędzia administratora')).toBeVisible();
    await expect(page.locator('text=Zarządzanie seriami')).toBeVisible();
  });

  test('powinien przejść do zarządzania seriami', async ({ page }) => {
    await page.click('[data-testid="admin-link"]');
    await page.click('a:has-text("Zarządzanie seriami")');
    await expect(page).toHaveURL('/series');
    await expect(page.locator('[data-testid="series-management"]')).toBeVisible();
  });

  test('powinien przejść do zarządzania odcinkami', async ({ page }) => {
    await page.click('[data-testid="admin-link"]');
    await page.click('a:has-text("Zarządzanie odcinkami")');
    await expect(page).toHaveURL('/episodes');
    await expect(page.locator('[data-testid="episodes-management"]')).toBeVisible();
  });
}); 