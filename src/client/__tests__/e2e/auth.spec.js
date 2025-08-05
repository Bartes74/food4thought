import { test, expect } from '@playwright/test';
import { loginUser } from './helpers.js';

test.describe('Autoryzacja', () => {
  test.beforeEach(async ({ page }) => {
    // Przejdź do strony głównej przed każdym testem
    await page.goto('/');
  });

  test('powinien wyświetlić formularz logowania', async ({ page }) => {
    // Sprawdź czy jesteśmy na stronie logowania
    await expect(page).toHaveURL('/login');
    
    // Sprawdź czy formularz logowania jest widoczny
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Sprawdź czy są odpowiednie etykiety - używamy bardziej specyficznych selektorów
    // Sprawdzamy czy etykiety istnieją, niezależnie od języka
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    
    // Sprawdzamy czy etykiety zawierają tekst (Email/Password lub Email/Hasło)
    const emailLabel = await page.locator('label[for="email"]').textContent();
    const passwordLabel = await page.locator('label[for="password"]').textContent();
    
    expect(emailLabel).toMatch(/email/i);
    expect(passwordLabel).toMatch(/password|hasło/i);
  });

  test('powinien zalogować administratora', async ({ page }) => {
    // Użyj helpera do logowania
    await loginUser(page, 'admin@food4thought.local', 'admin123');
    
    // Sprawdź czy header jest widoczny (oznacza zalogowanie)
    await expect(page.locator('header')).toBeVisible();
    
    // Sprawdź czy jest przycisk wylogowania
    await expect(page.locator('button[title*="Wyloguj"], button[title*="logout"]')).toBeVisible();
  });

  test('powinien wyświetlić błąd dla nieprawidłowych danych', async ({ page }) => {
    // Wypełnij formularz nieprawidłowymi danymi
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Kliknij przycisk logowania
    await page.click('button[type="submit"]');
    
    // Sprawdź czy pojawił się komunikat o błędzie
    await expect(page.locator('.error-message, [data-testid="error"]')).toBeVisible();
    
    // Sprawdź czy nadal jesteśmy na stronie logowania
    await expect(page).toHaveURL('/login');
  });

  test('powinien przejść do rejestracji', async ({ page }) => {
    // Kliknij link do rejestracji
    await page.click('a:has-text("Zarejestruj się")');
    
    // Sprawdź czy przejście do strony rejestracji
    await expect(page).toHaveURL('/register');
    
    // Sprawdź czy formularz rejestracji jest widoczny
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test('powinien zarejestrować nowego użytkownika', async ({ page }) => {
    // Przejdź do strony rejestracji
    await page.goto('/register');
    
    // Generuj unikalny email
    const uniqueEmail = `test${Date.now()}@example.com`;
    
    // Wypełnij formularz rejestracji
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', 'testpassword123');
    await page.fill('input[name="confirmPassword"]', 'testpassword123');
    
    // Kliknij przycisk rejestracji
    await page.click('button[type="submit"]');
    
    // Sprawdź czy zostało przekierowanie do strony głównej
    await expect(page).toHaveURL('/');
    
    // Sprawdź czy menu nawigacyjne jest widoczne
    await expect(page.locator('header')).toBeVisible();
  });

  test('powinien wylogować użytkownika', async ({ page }) => {
    // Najpierw zaloguj się
    await loginUser(page, 'admin@food4thought.local', 'admin123');
    
    // Sprawdź czy jesteśmy zalogowani
    await expect(page.locator('header')).toBeVisible();
    
    // Kliknij przycisk wylogowania
    await page.click('button[title*="Wyloguj"], button[title*="logout"]');
    
    // Sprawdź czy zostało przekierowanie do logowania
    await expect(page).toHaveURL('/login');
    
    // Sprawdź czy formularz logowania jest widoczny
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('powinien zachować sesję po odświeżeniu strony', async ({ page }) => {
    // Zaloguj się
    await loginUser(page, 'admin@food4thought.local', 'admin123');
    
    // Sprawdź czy jesteśmy zalogowani
    await expect(page.locator('header')).toBeVisible();
    
    // Odśwież stronę
    await page.reload();
    
    // Sprawdź czy nadal jesteśmy zalogowani
    await expect(page).toHaveURL('/');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('button[title*="Wyloguj"], button[title*="logout"]')).toBeVisible();
  });
}); 