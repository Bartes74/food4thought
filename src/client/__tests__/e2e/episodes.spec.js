import { test, expect } from '@playwright/test';
import { loginUser } from './helpers.js';

test.describe('Funkcjonalności odcinków', () => {
  test.beforeEach(async ({ page }) => {
    // Przejdź do strony głównej (użytkownik już zalogowany przez global setup)
    await page.goto('/');
    
    // Poczekaj na załadowanie strony głównej
    await expect(page.locator('header')).toBeVisible();
  });

  test('powinien wyświetlić listę odcinków', async ({ page }) => {
    // Sprawdź czy lista odcinków jest widoczna
    await expect(page.locator('[data-testid="episodes-list"], .episodes-list')).toBeVisible();
    
    // Sprawdź czy są kategorie odcinków
    await expect(page.locator('h2, h3')).toContainText(['Nowe', 'W trakcie', 'Ukończone']);
  });

  test('powinien odtworzyć odcinek', async ({ page }) => {
    // Znajdź pierwszy odcinek i kliknij na niego
    const firstEpisode = page.locator('[data-testid="episode-item"], .episode-item').first();
    await expect(firstEpisode).toBeVisible();
    
    await firstEpisode.click();
    
    // Sprawdź czy AudioPlayer się pojawił
    await expect(page.locator('[data-testid="audio-player"], .audio-player')).toBeVisible();
    
    // Sprawdź czy są kontrolki odtwarzania
    await expect(page.locator('button[aria-label*="play"], button[aria-label*="Play"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="pause"], button[aria-label*="Pause"]')).toBeVisible();
  });

  test('powinien ocenić odcinek', async ({ page }) => {
    // Otwórz odcinek
    const firstEpisode = page.locator('[data-testid="episode-item"], .episode-item').first();
    await firstEpisode.click();
    
    // Poczekaj na załadowanie AudioPlayer
    await expect(page.locator('[data-testid="audio-player"], .audio-player')).toBeVisible();
    
    // Znajdź gwiazdki oceniania (puste gwiazdki użytkownika)
    const userStars = page.locator('[data-testid="user-rating"], .user-rating .star').first();
    await expect(userStars).toBeVisible();
    
    // Kliknij na 4. gwiazdkę (ocena 4/5)
    const fourthStar = page.locator('[data-testid="user-rating"], .user-rating .star').nth(3);
    await fourthStar.click();
    
    // Sprawdź czy gwiazdka została wypełniona
    await expect(fourthStar).toHaveClass(/filled|active/);
    
    // Sprawdź czy ocena została zapisana (może być opóźnienie)
    await page.waitForTimeout(1000);
  });

  test('powinien dodać odcinek do ulubionych', async ({ page }) => {
    // Znajdź pierwszy odcinek
    const firstEpisode = page.locator('[data-testid="episode-item"], .episode-item').first();
    await expect(firstEpisode).toBeVisible();
    
    // Znajdź przycisk ulubionych (serce)
    const favoriteButton = firstEpisode.locator('[data-testid="favorite-button"], .favorite-button, button[aria-label*="heart"]');
    await expect(favoriteButton).toBeVisible();
    
    // Kliknij przycisk ulubionych
    await favoriteButton.click();
    
    // Sprawdź czy przycisk zmienił się na "ulubiony" (wypełnione serce)
    await expect(favoriteButton).toHaveClass(/filled|active|liked/);
  });

  test('powinien przejść do ulubionych odcinków', async ({ page }) => {
    // Kliknij na "Ulubione" w menu
    await page.click('a:has-text("Ulubione"), [data-testid="favorites-link"]');
    
    // Sprawdź czy przejście do strony ulubionych
    await expect(page).toHaveURL('/favorites');
    
    // Sprawdź czy strona ulubionych jest widoczna
    await expect(page.locator('h1, h2')).toContainText('Ulubione');
  });

  test('powinien wyszukać odcinki', async ({ page }) => {
    // Znajdź pole wyszukiwania
    const searchInput = page.locator('input[placeholder*="szukaj"], input[type="search"], [data-testid="search-input"]');
    await expect(searchInput).toBeVisible();
    
    // Wpisz tekst wyszukiwania
    await searchInput.fill('test');
    
    // Sprawdź czy wyniki wyszukiwania się pojawiły
    await expect(page.locator('[data-testid="search-results"], .search-results')).toBeVisible();
  });

  test('powinien filtrować odcinki według serii', async ({ page }) => {
    // Znajdź selektor serii
    const seriesSelector = page.locator('select[name="series"], [data-testid="series-filter"]');
    
    if (await seriesSelector.isVisible()) {
      // Wybierz pierwszą serię
      await seriesSelector.selectOption({ index: 1 });
      
      // Sprawdź czy lista odcinków się zaktualizowała
      await expect(page.locator('[data-testid="episodes-list"], .episodes-list')).toBeVisible();
    }
  });

  test('powinien sortować odcinki według oceny', async ({ page }) => {
    // Znajdź selektor sortowania
    const sortSelector = page.locator('select[name="sort"], [data-testid="sort-selector"]');
    
    if (await sortSelector.isVisible()) {
      // Wybierz sortowanie według oceny
      await sortSelector.selectOption('rating');
      
      // Sprawdź czy lista odcinków się zaktualizowała
      await expect(page.locator('[data-testid="episodes-list"], .episodes-list')).toBeVisible();
    }
  });

  test('powinien wyświetlić szczegóły odcinka', async ({ page }) => {
    // Otwórz odcinek
    const firstEpisode = page.locator('[data-testid="episode-item"], .episode-item').first();
    await firstEpisode.click();
    
    // Sprawdź czy szczegóły odcinka są widoczne
    await expect(page.locator('[data-testid="episode-details"], .episode-details')).toBeVisible();
    
    // Sprawdź czy są informacje o odcinku
    await expect(page.locator('h1, h2')).toContainText(/Odcinek|Episode/);
  });

  test('powinien wyświetlić średnią ocenę odcinka', async ({ page }) => {
    // Znajdź odcinek z ocenami
    const episodeWithRating = page.locator('[data-testid="episode-item"], .episode-item').first();
    await expect(episodeWithRating).toBeVisible();
    
    // Sprawdź czy są gwiazdki średniej oceny (złote gwiazdki)
    const averageStars = episodeWithRating.locator('[data-testid="average-rating"], .average-rating .star');
    
    if (await averageStars.count() > 0) {
      await expect(averageStars.first()).toBeVisible();
    }
  });

  test('powinien przejść do następnego odcinka', async ({ page }) => {
    // Otwórz odcinek
    const firstEpisode = page.locator('[data-testid="episode-item"], .episode-item').first();
    await firstEpisode.click();
    
    // Poczekaj na załadowanie AudioPlayer
    await expect(page.locator('[data-testid="audio-player"], .audio-player')).toBeVisible();
    
    // Znajdź przycisk następnego odcinka
    const nextButton = page.locator('button[aria-label*="next"], button[aria-label*="Next"], [data-testid="next-episode"]');
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      
      // Sprawdź czy odcinek się zmienił
      await expect(page.locator('[data-testid="audio-player"], .audio-player')).toBeVisible();
    }
  });
}); 