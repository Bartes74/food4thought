import { test, expect } from '@playwright/test';
import { loginUser } from './helpers.js';

test.describe('Autoryzacja', () => {
  test.beforeEach(async ({ page }) => {
    // Przejdź do strony głównej (użytkownik już zalogowany przez global setup)
    await page.goto('/');
    
    // Poczekaj na załadowanie strony głównej
    await expect(page.locator('header')).toBeVisible();
    
    // Poczekaj na zakończenie loading state
    await page.waitForSelector('text=Ładowanie...', { state: 'hidden' });
  });

  test('powinien wylogować użytkownika', async ({ page }) => {
    // Kliknij przycisk wylogowania
    await page.click('button[title*="Wyloguj"], button[title*="logout"]');
    
    // Sprawdź czy użytkownik został wylogowany (przekierowanie do logowania)
    await expect(page).toHaveURL('/login');
    
    // Sprawdź czy formularz logowania jest widoczny
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('powinien zachować sesję po odświeżeniu strony', async ({ page }) => {
    // Odśwież stronę
    await page.reload();
    
    // Poczekaj na załadowanie
    await expect(page.locator('header')).toBeVisible();
    
    // Sprawdź czy użytkownik nadal jest zalogowany (nie ma przekierowania do logowania)
    await expect(page).toHaveURL('/');
    
    // Sprawdź czy email użytkownika jest widoczny w headerze
    await expect(page.locator('header')).toContainText('admin@food4thought.local');
  });
}); 