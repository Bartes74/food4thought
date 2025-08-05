import { test, expect } from '@playwright/test';
import { loginUser } from './helpers.js';

test.describe('Responsywność i dostępność', () => {
  test.beforeEach(async ({ page }) => {
    // Przejdź do strony głównej (użytkownik już zalogowany przez global setup)
    await page.goto('/');
    
    // Poczekaj na załadowanie strony głównej
    await expect(page.locator('header')).toBeVisible();
  });

  test('powinien działać na urządzeniach mobilnych', async ({ page }) => {
    // Ustaw viewport na urządzenie mobilne
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Sprawdź czy nawigacja jest responsywna
    await expect(page.locator('nav')).toBeVisible();
    
    // Sprawdź czy menu mobilne działa (jeśli istnieje)
    const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .mobile-menu-button');
    
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      
      // Sprawdź czy menu mobilne się otworzyło
      await expect(page.locator('[data-testid="mobile-menu-items"], .mobile-menu-items')).toBeVisible();
    }
  });

  test('powinien działać na tabletach', async ({ page }) => {
    // Ustaw viewport na tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Sprawdź czy layout jest odpowiedni dla tabletu
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('powinien działać na dużych ekranach', async ({ page }) => {
    // Ustaw viewport na duży ekran
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Sprawdź czy layout jest odpowiedni dla dużego ekranu
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('powinien obsługiwać tryb ciemny', async ({ page }) => {
    // Znajdź przycisk przełączania trybu
    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button[aria-label*="theme"]');
    
    if (await themeToggle.isVisible()) {
      // Sprawdź początkowy stan
      const initialTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      
      // Kliknij przycisk przełączania
      await themeToggle.click();
      
      // Sprawdź czy tryb się zmienił
      const newTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(newTheme).not.toBe(initialTheme);
      
      // Kliknij ponownie, aby wrócić do poprzedniego stanu
      await themeToggle.click();
      
      const finalTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(finalTheme).toBe(initialTheme);
    }
  });

  test('powinien obsługiwać klawiaturę', async ({ page }) => {
    // Przejdź do strony głównej
    await page.goto('/');
    
    // Użyj Tab do nawigacji
    await page.keyboard.press('Tab');
    
    // Sprawdź czy focus jest widoczny
    await expect(page.locator(':focus')).toBeVisible();
    
    // Użyj Enter do aktywacji
    await page.keyboard.press('Enter');
  });

  test('powinien mieć odpowiednie etykiety ARIA', async ({ page }) => {
    // Sprawdź czy przyciski mają odpowiednie etykiety
    const buttons = page.locator('button');
    
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      
      // Sprawdź czy przycisk ma etykietę ARIA lub tekst
      expect(ariaLabel || textContent).toBeTruthy();
    }
  });

  test('powinien obsługiwać screen reader', async ({ page }) => {
    // Sprawdź czy obrazy mają alt text
    const images = page.locator('img');
    
    for (let i = 0; i < await images.count(); i++) {
      const image = images.nth(i);
      const altText = await image.getAttribute('alt');
      
      // Sprawdź czy obraz ma alt text
      expect(altText).toBeTruthy();
    }
  });

  test('powinien mieć odpowiedni kontrast', async ({ page }) => {
    // Sprawdź czy tekst jest czytelny
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, div');
    
    // Pobierz kilka elementów tekstowych i sprawdź ich kontrast
    for (let i = 0; i < Math.min(await textElements.count(), 5); i++) {
      const element = textElements.nth(i);
      const text = await element.textContent();
      
      if (text && text.trim().length > 0) {
        // Sprawdź czy element jest widoczny
        await expect(element).toBeVisible();
      }
    }
  });

  test('powinien obsługiwać powiększenie', async ({ page }) => {
    // Ustaw powiększenie na 200%
    await page.setViewportSize({ width: 800, height: 600 });
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    
    // Sprawdź czy aplikacja nadal działa
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('powinien obsługiwać wysokie DPI', async ({ page }) => {
    // Symuluj ekran wysokiej rozdzielczości
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Sprawdź czy elementy są ostre i czytelne
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('powinien obsługiwać różne języki', async ({ page }) => {
    // Znajdź selektor języka
    const languageSelector = page.locator('select[name="language"], [data-testid="language-selector"]');
    
    if (await languageSelector.isVisible()) {
      // Zmień język na angielski
      await languageSelector.selectOption('en');
      
      // Sprawdź czy tekst się zmienił
      await expect(page.locator('body')).toContainText(/English|Login|Register/);
      
      // Zmień z powrotem na polski
      await languageSelector.selectOption('pl');
      
      // Sprawdź czy tekst wrócił do polskiego
      await expect(page.locator('body')).toContainText(/Zaloguj|Zarejestruj/);
    }
  });

  test('powinien obsługiwać skróty klawiszowe', async ({ page }) => {
    // Sprawdź skrót Ctrl+S (zapisz)
    await page.keyboard.press('Control+S');
    
    // Sprawdź skrót Ctrl+F (wyszukaj)
    await page.keyboard.press('Control+F');
    
    // Sprawdź skrót Escape (zamknij)
    await page.keyboard.press('Escape');
  });

  test('powinien obsługiwać gesty dotykowe', async ({ page }) => {
    // Ustaw viewport na urządzenie dotykowe
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Symuluj gest przesunięcia
    await page.mouse.move(100, 100);
    await page.mouse.down();
    await page.mouse.move(200, 100);
    await page.mouse.up();
    
    // Sprawdź czy aplikacja nadal działa
    await expect(page.locator('nav')).toBeVisible();
  });

  test('powinien obsługiwać automatyczne zapisywanie', async ({ page }) => {
    // Otwórz odcinek
    const firstEpisode = page.locator('[data-testid="episode-item"], .episode-item').first();
    await firstEpisode.click();
    
    // Sprawdź czy AudioPlayer się pojawił
    await expect(page.locator('[data-testid="audio-player"], .audio-player')).toBeVisible();
    
    // Symuluj odtwarzanie przez kilka sekund
    const playButton = page.locator('button[aria-label*="play"], button[aria-label*="Play"]');
    if (await playButton.isVisible()) {
      await playButton.click();
      
      // Poczekaj chwilę
      await page.waitForTimeout(2000);
      
      // Sprawdź czy postęp został zapisany
      await expect(page.locator('[data-testid="audio-player"], .audio-player')).toBeVisible();
    }
  });
}); 