# Testy End-to-End (E2E) - Playwright

## 📋 Przegląd

Testy E2E dla aplikacji Food4Thought używają **Playwright** do testowania głównych ścieżek użytkownika w rzeczywistych przeglądarkach.

## 🏗️ Struktura testów

```
src/client/__tests__/e2e/
├── auth.spec.js          # Testy autoryzacji
├── episodes.spec.js      # Testy funkcjonalności odcinków
├── stats.spec.js         # Testy statystyk użytkownika
├── admin.spec.js         # Testy panelu administratora
├── accessibility.spec.js # Testy responsywności i dostępności
├── helpers.js           # Funkcje pomocnicze
└── README.md            # Ta dokumentacja
```

## 🚀 Uruchamianie testów

### Podstawowe komendy

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom testy z interfejsem graficznym
npm run test:e2e:ui

# Uruchom testy w trybie headed (widoczne przeglądarki)
npm run test:e2e:headed

# Uruchom testy w trybie debug
npm run test:e2e:debug

# Pokaż raport HTML
npm run test:e2e:report
```

### Uruchamianie konkretnych testów

```bash
# Uruchom tylko testy autoryzacji
npx playwright test auth.spec.js

# Uruchom testy na konkretnej przeglądarce
npx playwright test --project=chromium

# Uruchom testy na urządzeniach mobilnych
npx playwright test --project="Mobile Chrome"
```

## 📱 Testowane przeglądarki

- **Chromium** - Desktop Chrome
- **Firefox** - Desktop Firefox  
- **WebKit** - Desktop Safari
- **Mobile Chrome** - Android Chrome
- **Mobile Safari** - iOS Safari

## 🧪 Kategorie testów

### 1. Autoryzacja (`auth.spec.js`)
- ✅ Logowanie administratora
- ✅ Rejestracja nowego użytkownika
- ✅ Walidacja formularzy
- ✅ Obsługa błędów logowania
- ✅ Wylogowanie
- ✅ Zachowanie sesji

### 2. Funkcjonalności odcinków (`episodes.spec.js`)
- ✅ Wyświetlanie listy odcinków
- ✅ Odtwarzanie odcinków
- ✅ Ocenianie odcinków (system gwiazdek)
- ✅ Dodawanie do ulubionych
- ✅ Wyszukiwanie i filtrowanie
- ✅ Sortowanie według ocen
- ✅ Szczegóły odcinka

### 3. Statystyki użytkownika (`stats.spec.js`)
- ✅ Przejście do statystyk
- ✅ Przełączanie między zakładkami
- ✅ Statystyki przeglądowe
- ✅ Statystyki według serii
- ✅ System osiągnięć
- ✅ Historia słuchania
- ✅ Oceny użytkownika
- ✅ Wzorce słuchania

### 4. Panel administratora (`admin.spec.js`)
- ✅ Przejście do panelu admin
- ✅ Statystyki systemowe
- ✅ Zarządzanie użytkownikami
- ✅ Zarządzanie seriami
- ✅ Zarządzanie odcinkami
- ✅ Dodawanie/edycja/usuwanie
- ✅ Logi systemowe
- ✅ Eksport danych

### 5. Automatyczne odtwarzanie (`episodes.spec.js`)
- ✅ Toggle automatycznego odtwarzania
- ✅ Włączanie/wyłączanie funkcji
- ✅ Obsługa zakończenia odcinka
- ✅ Przejście do następnego odcinka
- ✅ Powiadomienia o następnym odcinku
- ✅ Obsługa braku kolejnych odcinków

### 6. Dostępność i responsywność (`accessibility.spec.js`)
- ✅ Etykiety ARIA dla przycisków
- ✅ Dostępność kontrolek odtwarzacza
- ✅ Dostępność automatycznego odtwarzania
- ✅ Obsługa powiadomień
- ✅ Responsywność na różnych urządzeniach
- ✅ Nawigacja klawiaturą

### 7. Zarządzanie sesją (`auth.spec.js`)
- ✅ Automatyczne odświeżanie tokenu
- ✅ Obsługa wygaśnięcia sesji
- ✅ Obsługa nieprawidłowego tokenu
- ✅ Zachowanie sesji po odświeżeniu
- ✅ Bezpieczne wylogowanie

## 🔧 Konfiguracja

### Playwright Config (`playwright.config.js`)

```javascript
module.exports = defineConfig({
  testDir: './src/client/__tests__/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run start:test',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Skrypty npm

```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:debug": "playwright test --debug",
  "test:e2e:report": "playwright show-report",
  "start:test": "concurrently \"npm run dev\" \"npm run client\" --kill-others"
}
```

## 🛠️ Helpery

Plik `helpers.js` zawiera funkcje pomocnicze:

- `loginUser()` - Logowanie użytkownika
- `waitForElement()` - Oczekiwanie na element
- `generateUniqueEmail()` - Generowanie unikalnych emaili
- `checkResponsiveness()` - Sprawdzanie responsywności
- `simulateAudioPlayback()` - Symulacja odtwarzania
- `toggleTheme()` - Przełączanie trybu ciemnego
- `testKeyboardNavigation()` - Test nawigacji klawiaturą

## 📊 Raporty

### HTML Report
Po uruchomieniu testów, raport HTML jest dostępny pod adresem:
```bash
npm run test:e2e:report
```

### Screenshots i Video
- Screenshots są zapisywane tylko przy błędach
- Video jest zapisywane tylko przy błędach
- Trace jest zapisywany przy retry

## 🐛 Debugowanie

### Tryb Debug
```bash
npm run test:e2e:debug
```

### Tryb UI
```bash
npm run test:e2e:ui
```

### Konkretny test
```bash
npx playwright test auth.spec.js --debug
```

## 🔍 Selektory

Testy używają różnych typów selektorów:

### Data Test ID (preferowane)
```javascript
await page.locator('[data-testid="episode-item"]').click();
```

### CSS Selectors
```javascript
await page.locator('.episode-item').click();
```

### Text Content
```javascript
await page.click('button:has-text("Zaloguj")');
```

### ARIA Labels
```javascript
await page.locator('button[aria-label*="play"]').click();
```

## ⚡ Najlepsze praktyki

### 1. Oczekiwania
```javascript
// ✅ Dobrze - czekaj na element
await expect(page.locator('.episode-item')).toBeVisible();

// ❌ Źle - nie używaj sleep
await page.waitForTimeout(2000);
```

### 2. Selektory
```javascript
// ✅ Dobrze - używaj data-testid
await page.locator('[data-testid="episode-item"]').click();

// ❌ Źle - unikaj złożonych selektorów CSS
await page.locator('div > div > div > button').click();
```

### 3. Asercje
```javascript
// ✅ Dobrze - sprawdzaj stan elementów
await expect(page.locator('.star')).toHaveClass(/filled/);

// ❌ Źle - nie sprawdzaj tylko obecności
await expect(page.locator('.star')).toBeVisible();
```

### 4. Setup/Teardown
```javascript
test.beforeEach(async ({ page }) => {
  // Zaloguj się przed każdym testem
  await loginUser(page);
});

test.afterEach(async ({ page }) => {
  // Wyczyść stan po teście
  await page.evaluate(() => localStorage.clear());
});
```

## 🚨 Rozwiązywanie problemów

### Częste problemy

1. **Test nie może znaleźć elementu**
   - Sprawdź czy element jest widoczny
   - Użyj `await page.waitForSelector()`
   - Sprawdź czy nie ma animacji

2. **Test jest niestabilny**
   - Dodaj odpowiednie oczekiwania
   - Użyj `retry` w konfiguracji
   - Sprawdź timing aplikacji

3. **Test nie działa na CI**
   - Sprawdź czy webServer się uruchamia
   - Zwiększ timeout w konfiguracji
   - Sprawdź logi CI

### Debugowanie

```bash
# Uruchom z logami
DEBUG=pw:api npx playwright test

# Uruchom z trace
npx playwright test --trace on

# Sprawdź trace
npx playwright show-trace trace.zip
```

## 📈 CI/CD

### GitHub Actions
```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: npm run test:e2e

- name: Upload test results
  uses: actions/upload-artifact@v2
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## 🔄 Aktualizacje

### Aktualizacja Playwright
```bash
npm update @playwright/test
npx playwright install
```

### Aktualizacja przeglądarek
```bash
npx playwright install
```

## 📚 Przydatne linki

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Playwright Assertions](https://playwright.dev/docs/test-assertions)
- [Playwright Selectors](https://playwright.dev/docs/selectors)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) 