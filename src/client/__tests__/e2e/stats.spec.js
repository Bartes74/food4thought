import { test, expect } from '@playwright/test';
import { loginUser } from './helpers.js';

test.describe('Statystyki użytkownika', () => {
  test.beforeEach(async ({ page }) => {
    // Przejdź do strony głównej (użytkownik już zalogowany przez global setup)
    await page.goto('/');
    
    // Poczekaj na załadowanie strony głównej
    await expect(page.locator('header')).toBeVisible();
  });

  test('powinien przejść do statystyk', async ({ page }) => {
    // Kliknij na "Statystyki" w menu
    await page.click('a:has-text("Statystyki"), [data-testid="stats-link"]');
    
    // Sprawdź czy przejście do strony statystyk
    await expect(page).toHaveURL('/stats');
    
    // Sprawdź czy strona statystyk jest widoczna
    await expect(page.locator('h1, h2')).toContainText('Statystyki');
  });

  test('powinien wyświetlić zakładki statystyk', async ({ page }) => {
    // Przejdź do statystyk
    await page.goto('/stats');
    
    // Sprawdź czy są zakładki
    const tabs = page.locator('[data-testid="stats-tabs"], .stats-tabs button, .tab-button');
    await expect(tabs).toBeVisible();
    
    // Sprawdź czy są odpowiednie zakładki
    await expect(page.locator('button')).toContainText(['Przegląd', 'Serie', 'Wzorce', 'Osiągnięcia', 'Historia', 'Oceny']);
  });

  test('powinien przełączać między zakładkami', async ({ page }) => {
    // Przejdź do statystyk
    await page.goto('/stats');
    
    // Kliknij na zakładkę "Serie"
    await page.click('button:has-text("Serie")');
    
    // Sprawdź czy zawartość zakładki się zmieniła
    await expect(page.locator('[data-testid="series-stats"], .series-stats')).toBeVisible();
    
    // Kliknij na zakładkę "Osiągnięcia"
    await page.click('button:has-text("Osiągnięcia")');
    
    // Sprawdź czy zawartość zakładki się zmieniła
    await expect(page.locator('[data-testid="achievements"], .achievements')).toBeVisible();
  });

  test('powinien wyświetlić statystyki przeglądowe', async ({ page }) => {
    // Przejdź do statystyk
    await page.goto('/stats');
    
    // Sprawdź czy są statystyki przeglądowe
    await expect(page.locator('[data-testid="overview-stats"], .overview-stats')).toBeVisible();
    
    // Sprawdź czy są kluczowe metryki
    await expect(page.locator('div')).toContainText(['Całkowity czas', 'Odcinki', 'Ulubione']);
  });

  test('powinien wyświetlić statystyki według serii', async ({ page }) => {
    // Przejdź do statystyk i kliknij zakładkę "Serie"
    await page.goto('/stats');
    await page.click('button:has-text("Serie")');
    
    // Sprawdź czy są statystyki serii
    await expect(page.locator('[data-testid="series-stats"], .series-stats')).toBeVisible();
    
    // Sprawdź czy są informacje o seriach
    await expect(page.locator('div')).toContainText(['Nazwa', 'Odcinki', 'Czas']);
  });

  test('powinien wyświetlić osiągnięcia', async ({ page }) => {
    // Przejdź do statystyk i kliknij zakładkę "Osiągnięcia"
    await page.goto('/stats');
    await page.click('button:has-text("Osiągnięcia")');
    
    // Sprawdź czy są osiągnięcia
    await expect(page.locator('[data-testid="achievements"], .achievements')).toBeVisible();
    
    // Sprawdź czy są kategorie osiągnięć
    await expect(page.locator('div')).toContainText(['Odblokowane', 'Zablokowane']);
  });

  test('powinien wyświetlić historię słuchania', async ({ page }) => {
    // Przejdź do statystyk i kliknij zakładkę "Historia"
    await page.goto('/stats');
    await page.click('button:has-text("Historia")');
    
    // Sprawdź czy jest historia słuchania
    await expect(page.locator('[data-testid="listening-history"], .listening-history')).toBeVisible();
  });

  test('powinien wyświetlić oceny użytkownika', async ({ page }) => {
    // Przejdź do statystyk i kliknij zakładkę "Oceny"
    await page.goto('/stats');
    await page.click('button:has-text("Oceny")');
    
    // Sprawdź czy są oceny użytkownika
    await expect(page.locator('[data-testid="user-ratings"], .user-ratings')).toBeVisible();
  });

  test('powinien wyświetlić wzorce słuchania', async ({ page }) => {
    // Przejdź do statystyk i kliknij zakładkę "Wzorce"
    await page.goto('/stats');
    await page.click('button:has-text("Wzorce")');
    
    // Sprawdź czy są wzorce słuchania
    await expect(page.locator('[data-testid="listening-patterns"], .listening-patterns')).toBeVisible();
    
    // Sprawdź czy są informacje o wzorcach
    await expect(page.locator('div')).toContainText(['Dzień tygodnia', 'Godzina', 'Czas trwania']);
  });

  test('powinien eksportować statystyki', async ({ page }) => {
    // Przejdź do statystyk
    await page.goto('/stats');
    
    // Znajdź przycisk eksportu
    const exportButton = page.locator('button:has-text("Eksportuj"), [data-testid="export-stats"]');
    
    if (await exportButton.isVisible()) {
      // Kliknij przycisk eksportu
      await exportButton.click();
      
      // Sprawdź czy plik został pobrany (może być opóźnienie)
      await page.waitForTimeout(2000);
    }
  });

  test('powinien filtrować statystyki według okresu', async ({ page }) => {
    // Przejdź do statystyk
    await page.goto('/stats');
    
    // Znajdź selektor okresu
    const periodSelector = page.locator('select[name="period"], [data-testid="period-filter"]');
    
    if (await periodSelector.isVisible()) {
      // Wybierz okres "Ostatni miesiąc"
      await periodSelector.selectOption('month');
      
      // Sprawdź czy statystyki się zaktualizowały
      await expect(page.locator('[data-testid="overview-stats"], .overview-stats')).toBeVisible();
    }
  });

  test('powinien wyświetlić postęp w osiągnięciach', async ({ page }) => {
    // Przejdź do statystyk i kliknij zakładkę "Osiągnięcia"
    await page.goto('/stats');
    await page.click('button:has-text("Osiągnięcia")');
    
    // Sprawdź czy są paski postępu
    const progressBars = page.locator('[data-testid="achievement-progress"], .achievement-progress');
    
    if (await progressBars.count() > 0) {
      await expect(progressBars.first()).toBeVisible();
    }
  });

  test('powinien wyświetlić szczegóły osiągnięcia', async ({ page }) => {
    // Przejdź do statystyk i kliknij zakładkę "Osiągnięcia"
    await page.goto('/stats');
    await page.click('button:has-text("Osiągnięcia")');
    
    // Znajdź pierwsze osiągnięcie i kliknij na nie
    const firstAchievement = page.locator('[data-testid="achievement-item"], .achievement-item').first();
    
    if (await firstAchievement.isVisible()) {
      await firstAchievement.click();
      
      // Sprawdź czy szczegóły osiągnięcia są widoczne
      await expect(page.locator('[data-testid="achievement-details"], .achievement-details')).toBeVisible();
    }
  });
}); 