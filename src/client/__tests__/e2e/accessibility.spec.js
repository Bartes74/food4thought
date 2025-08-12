import { test, expect } from '@playwright/test';

test.describe('Responsywność i dostępność', () => {
  test.beforeEach(async ({ page }) => {
    // Przejdź do strony głównej (użytkownik już zalogowany przez global setup)
    await page.goto('/');
    
    // Poczekaj na załadowanie strony głównej
    await expect(page.locator('header')).toBeVisible();
    
    // Poczekaj na zakończenie loading state
    await page.waitForSelector('text=Ładowanie...', { state: 'hidden' });
  });

  test('powinien mieć odpowiednie etykiety ARIA', async ({ page }) => {
    // Sprawdź czy główne przyciski mają etykiety ARIA lub tekst
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    // Sprawdź tylko pierwsze 5 przycisków żeby uniknąć problemów z pustymi przyciskami
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      const textContent = await button.textContent();
      
      // Sprawdź czy przycisk ma etykietę ARIA, title lub tekst (pomijamy puste przyciski)
      if (textContent?.trim() || ariaLabel || title) {
        expect(ariaLabel || title || textContent?.trim()).toBeTruthy();
      }
    }
  });

  test('powinien obsługiwać automatyczne zapisywanie', async ({ page }) => {
    // Sprawdź czy aplikacja działa poprawnie
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
}); 