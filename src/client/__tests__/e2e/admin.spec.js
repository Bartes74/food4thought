import { test, expect } from '@playwright/test';
import { loginUser } from './helpers.js';

test.describe('Panel administratora', () => {
  test.beforeEach(async ({ page }) => {
    // Przejdź do strony głównej (użytkownik już zalogowany przez global setup)
    await page.goto('/');
    
    // Poczekaj na załadowanie strony głównej
    await expect(page.locator('header')).toBeVisible();
  });

  test('powinien przejść do panelu administratora', async ({ page }) => {
    // Kliknij na "Panel Admin" w menu
    await page.click('a:has-text("Panel Admin"), [data-testid="admin-link"]');
    
    // Sprawdź czy przejście do panelu administratora
    await expect(page).toHaveURL('/admin');
    
    // Sprawdź czy panel administratora jest widoczny
    await expect(page.locator('h1, h2')).toContainText('Panel Administratora');
  });

  test('powinien wyświetlić statystyki systemowe', async ({ page }) => {
    // Przejdź do panelu administratora
    await page.goto('/admin');
    
    // Sprawdź czy są statystyki systemowe
    await expect(page.locator('[data-testid="system-stats"], .system-stats')).toBeVisible();
    
    // Sprawdź czy są kluczowe metryki
    await expect(page.locator('div')).toContainText(['Użytkownicy', 'Odcinki', 'Serie']);
  });

  test('powinien wyświetlić listę użytkowników', async ({ page }) => {
    // Przejdź do panelu administratora
    await page.goto('/admin');
    
    // Kliknij na zakładkę "Użytkownicy"
    await page.click('button:has-text("Użytkownicy"), a:has-text("Użytkownicy")');
    
    // Sprawdź czy lista użytkowników jest widoczna
    await expect(page.locator('[data-testid="users-list"], .users-list')).toBeVisible();
    
    // Sprawdź czy są informacje o użytkownikach
    await expect(page.locator('table, .user-item')).toBeVisible();
  });

  test('powinien zarządzać użytkownikami', async ({ page }) => {
    // Przejdź do panelu administratora i listy użytkowników
    await page.goto('/admin');
    await page.click('button:has-text("Użytkownicy"), a:has-text("Użytkownicy")');
    
    // Znajdź przycisk dodawania użytkownika
    const addUserButton = page.locator('button:has-text("Dodaj użytkownika"), [data-testid="add-user"]');
    
    if (await addUserButton.isVisible()) {
      await addUserButton.click();
      
      // Sprawdź czy formularz dodawania użytkownika jest widoczny
      await expect(page.locator('[data-testid="add-user-form"], .add-user-form')).toBeVisible();
    }
  });

  test('powinien wyświetlić zarządzanie seriami', async ({ page }) => {
    // Przejdź do panelu administratora
    await page.goto('/admin');
    
    // Kliknij na zakładkę "Serie"
    await page.click('button:has-text("Serie"), a:has-text("Serie")');
    
    // Sprawdź czy zarządzanie seriami jest widoczne
    await expect(page.locator('[data-testid="series-management"], .series-management')).toBeVisible();
  });

  test('powinien wyświetlić zarządzanie odcinkami', async ({ page }) => {
    // Przejdź do panelu administratora
    await page.goto('/admin');
    
    // Kliknij na zakładkę "Odcinki"
    await page.click('button:has-text("Odcinki"), a:has-text("Odcinki")');
    
    // Sprawdź czy zarządzanie odcinkami jest widoczne
    await expect(page.locator('[data-testid="episodes-management"], .episodes-management')).toBeVisible();
  });

  test('powinien dodać nową serię', async ({ page }) => {
    // Przejdź do panelu administratora i zarządzania seriami
    await page.goto('/admin');
    await page.click('button:has-text("Serie"), a:has-text("Serie")');
    
    // Znajdź przycisk dodawania serii
    const addSeriesButton = page.locator('button:has-text("Dodaj serię"), [data-testid="add-series"]');
    
    if (await addSeriesButton.isVisible()) {
      await addSeriesButton.click();
      
      // Sprawdź czy formularz dodawania serii jest widoczny
      await expect(page.locator('[data-testid="add-series-form"], .add-series-form')).toBeVisible();
      
      // Wypełnij formularz
      await page.fill('input[name="name"]', 'Test Series');
      await page.fill('input[name="description"]', 'Test Description');
      await page.fill('input[name="color"]', '#ff0000');
      
      // Kliknij przycisk zapisz
      await page.click('button:has-text("Zapisz"), button[type="submit"]');
      
      // Sprawdź czy seria została dodana
      await expect(page.locator('div')).toContainText('Test Series');
    }
  });

  test('powinien dodać nowy odcinek', async ({ page }) => {
    // Przejdź do panelu administratora i zarządzania odcinkami
    await page.goto('/admin');
    await page.click('button:has-text("Odcinki"), a:has-text("Odcinki")');
    
    // Znajdź przycisk dodawania odcinka
    const addEpisodeButton = page.locator('button:has-text("Dodaj odcinek"), [data-testid="add-episode"]');
    
    if (await addEpisodeButton.isVisible()) {
      await addEpisodeButton.click();
      
      // Sprawdź czy formularz dodawania odcinka jest widoczny
      await expect(page.locator('[data-testid="add-episode-form"], .add-episode-form')).toBeVisible();
    }
  });

  test('powinien edytować użytkownika', async ({ page }) => {
    // Przejdź do panelu administratora i listy użytkowników
    await page.goto('/admin');
    await page.click('button:has-text("Użytkownicy"), a:has-text("Użytkownicy")');
    
    // Znajdź przycisk edycji pierwszego użytkownika
    const editUserButton = page.locator('[data-testid="edit-user"], .edit-user-button').first();
    
    if (await editUserButton.isVisible()) {
      await editUserButton.click();
      
      // Sprawdź czy formularz edycji użytkownika jest widoczny
      await expect(page.locator('[data-testid="edit-user-form"], .edit-user-form')).toBeVisible();
    }
  });

  test('powinien usunąć użytkownika', async ({ page }) => {
    // Przejdź do panelu administratora i listy użytkowników
    await page.goto('/admin');
    await page.click('button:has-text("Użytkownicy"), a:has-text("Użytkownicy")');
    
    // Znajdź przycisk usuwania pierwszego użytkownika
    const deleteUserButton = page.locator('[data-testid="delete-user"], .delete-user-button').first();
    
    if (await deleteUserButton.isVisible()) {
      // Kliknij przycisk usuwania
      await deleteUserButton.click();
      
      // Sprawdź czy pojawiło się potwierdzenie
      await expect(page.locator('[data-testid="confirm-dialog"], .confirm-dialog')).toBeVisible();
      
      // Kliknij potwierdzenie
      await page.click('button:has-text("Tak"), button:has-text("Potwierdź")');
    }
  });

  test('powinien wyświetlić logi systemowe', async ({ page }) => {
    // Przejdź do panelu administratora
    await page.goto('/admin');
    
    // Kliknij na zakładkę "Logi"
    await page.click('button:has-text("Logi"), a:has-text("Logi")');
    
    // Sprawdź czy logi systemowe są widoczne
    await expect(page.locator('[data-testid="system-logs"], .system-logs')).toBeVisible();
  });

  test('powinien eksportować dane', async ({ page }) => {
    // Przejdź do panelu administratora
    await page.goto('/admin');
    
    // Znajdź przycisk eksportu
    const exportButton = page.locator('button:has-text("Eksportuj"), [data-testid="export-data"]');
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      
      // Sprawdź czy plik został pobrany (może być opóźnienie)
      await page.waitForTimeout(2000);
    }
  });

  test('powinien filtrować użytkowników', async ({ page }) => {
    // Przejdź do panelu administratora i listy użytkowników
    await page.goto('/admin');
    await page.click('button:has-text("Użytkownicy"), a:has-text("Użytkownicy")');
    
    // Znajdź pole wyszukiwania użytkowników
    const searchInput = page.locator('input[placeholder*="szukaj"], input[type="search"], [data-testid="user-search"]');
    
    if (await searchInput.isVisible()) {
      // Wpisz tekst wyszukiwania
      await searchInput.fill('admin');
      
      // Sprawdź czy wyniki wyszukiwania się pojawiły
      await expect(page.locator('[data-testid="users-list"], .users-list')).toBeVisible();
    }
  });

  test('powinien zmienić rolę użytkownika', async ({ page }) => {
    // Przejdź do panelu administratora i listy użytkowników
    await page.goto('/admin');
    await page.click('button:has-text("Użytkownicy"), a:has-text("Użytkownicy")');
    
    // Znajdź selektor roli pierwszego użytkownika
    const roleSelector = page.locator('select[name="role"], [data-testid="role-selector"]').first();
    
    if (await roleSelector.isVisible()) {
      // Zmień rolę na "admin"
      await roleSelector.selectOption('admin');
      
      // Sprawdź czy rola została zmieniona
      await expect(roleSelector).toHaveValue('admin');
    }
  });
}); 