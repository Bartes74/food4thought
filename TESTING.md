# Testing Documentation - Food 4 Thought

## 🧪 Przegląd testów

Aplikacja Food 4 Thought zawiera kompleksowy system testów pokrywający wszystkie główne funkcjonalności.

## 📋 Typy testów

### 1. Testy jednostkowe (Unit Tests)
- **Framework**: Jest
- **Lokalizacja**: `src/client/__tests__/` i `src/server/__tests__/`
- **Pokrycie**: Komponenty React, utility functions, API endpoints

### 2. Testy integracyjne (Integration Tests)
- **Framework**: Jest + Supertest
- **Lokalizacja**: `src/server/__tests__/`
- **Pokrycie**: API endpoints, baza danych, middleware

### 3. Testy E2E (End-to-End)
- **Framework**: Playwright
- **Lokalizacja**: `src/client/__tests__/e2e/`
- **Pokrycie**: Pełne scenariusze użytkownika

## 🚀 Uruchomienie testów

### Podstawowe komendy
```bash
# Wszystkie testy
npm test

# Testy z watch mode
npm run test:watch

# Testy z coverage
npm run test:coverage

# Testy E2E
npm run test:e2e

# Testy E2E z UI
npm run test:e2e:ui
```

### Testy specyficzne
```bash
# Testy serwera
npm run test:server

# Testy klienta
npm run test:client

# Testy integracyjne
npm run test:integration
```

## 📊 Pokrycie testów

### Backend (API)
- ✅ **Autoryzacja** - login, register, token validation
- ✅ **Użytkownicy** - CRUD operations, role management
- ✅ **Serie** - zarządzanie seriami podcastów
- ✅ **Odcinki** - zarządzanie odcinkami, postęp, ulubione
- ✅ **Statystyki** - obliczanie statystyk użytkowników (w tym `seriesStats` w `/api/users/:id/stats`)
- ✅ **Osiągnięcia** - system osiągnięć i postęp (pola `progress_value`, `completed` w `/api/achievements`)
- ✅ **Powiadomienia** - system powiadomień administratorów

### Frontend (UI)
- ✅ **Komponenty** - AudioPlayer, Layout, Navigation
- ✅ **Strony** - HomePage, StatsPage, AchievementsPage
- ✅ **Konteksty** - AuthContext, ThemeContext, LanguageContext
- ✅ **Formularze** - Login, Register, Profile

### E2E Scenariusze
- ✅ **Rejestracja i logowanie**
- ✅ **Słuchanie odcinków**
- ✅ **Zarządzanie ulubionymi**
- ✅ **Przeglądanie statystyk**
- ✅ **System osiągnięć**
- ✅ **Panel administratora**
- ✅ **Powiadomienia o następnym odcinku**
- ✅ **Zarządzanie sesją użytkownika**

## 🎯 Testowane funkcjonalności

Uwaga: funkcja automatycznego odtwarzania została usunięta. Odpowiednie testy E2E zostały zaktualizowane lub usunięte.

### AudioUrl w odcinkach
```javascript
// Test audioUrl w odcinkach
describe('Episode AudioUrl', () => {
  test('should include audioUrl in episode details', async () => {
    // Test obecności audioUrl
  });
  
  test('should have correct audioUrl format', async () => {
    // Test formatu audioUrl
  });
});
```

### Średnia dokładność ukończenia
```javascript
// Test avg_completion
describe('Average Completion Rate', () => {
  test('should calculate completion rate correctly', async () => {
    // Test obliczania średniej dokładności
  });
  
  test('should update with new sessions', async () => {
    // Test aktualizacji z nowymi sesjami
  });
});

### System osiągnięć
```javascript
// Test sprawdzania osiągnięć
describe('Achievement System', () => {
  test('should award achievements and expose progress', async () => {
    // Test przyznawania i progresu przez /api/achievements
  });
});
```

### Statystyki użytkownika
```javascript
// Test obliczania statystyk
describe('User Statistics', () => {
  test('should include seriesStats in /api/users/:id/stats', async () => {
    // Test obecności seriesStats
  });
});
```

### System ulubionych
```javascript
// Test funkcjonalności ulubionych
describe('Favorites System', () => {
  test('should add episode to favorites', async () => {
    // Test dodawania do ulubionych
  });
  
  test('should remove episode from favorites', async () => {
    // Test usuwania z ulubionych
  });
});
```

## 🔧 Konfiguracja testów

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/index.js',
  ],
};
```

### Playwright Configuration
```javascript
// playwright.config.js
module.exports = {
  testDir: './src/client/__tests__/e2e',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
};
```

## 📈 Metryki testów

### Pokrycie kodu
- **Backend**: ~85%
- **Frontend**: ~80%
- **E2E**: ~90% scenariuszy

### Czas wykonania
- **Unit tests**: ~30s
- **Integration tests**: ~45s
- **E2E tests**: ~2min

## 🐛 Debugowanie testów

### Logi testów
```bash
# Szczegółowe logi
npm test -- --verbose

# Logi z coverage
npm run test:coverage -- --verbose

# Logi E2E
npm run test:e2e -- --debug
```

### Debugowanie E2E
```bash
# Uruchom testy z UI
npm run test:e2e:ui

# Debugowanie konkretnego testu
npx playwright test --debug test-name.spec.js
```

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

### Pre-commit hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test",
      "pre-push": "npm run test:e2e"
    }
  }
}
```

## 📝 Pisanie testów

### Struktura testu jednostkowego
```javascript
describe('Component Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  test('should render correctly', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Struktura testu integracyjnego
```javascript
describe('API Endpoint', () => {
  let server;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  test('should return correct data', async () => {
    const response = await request(server)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toMatchObject(expectedData);
  });
});
```

### Struktura testu E2E
```javascript
test('user can complete full workflow', async ({ page }) => {
  // Navigate to page
  await page.goto('/');
  
  // Perform actions
  await page.click('[data-testid="login-button"]');
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  
  // Assert results
  await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
});
```

## 🎯 Best Practices

### 1. Test Naming
```javascript
// ✅ Dobrze
test('should display error message when login fails', () => {});

// ❌ Źle
test('test1', () => {});
```

### 2. Test Isolation
```javascript
// ✅ Dobrze
beforeEach(() => {
  // Reset state for each test
});

// ❌ Źle
// Relying on state from previous tests
```

### 3. Assertions
```javascript
// ✅ Dobrze
expect(element).toBeInTheDocument();
expect(apiResponse).toMatchObject(expectedData);

// ❌ Źle
expect(element).toBeTruthy(); // Too generic
```

### 4. Mocking
```javascript
// ✅ Dobrze
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: mockData }))
}));

// ❌ Źle
// Mocking too much, making tests unrealistic
```

## 🚨 Znane problemy

### 1. Async/Await w testach
```javascript
// ✅ Poprawnie
test('async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});

// ❌ Niepoprawnie
test('async operation', () => {
  asyncFunction().then(result => {
    expect(result).toBe(expected);
  });
});
```

### 2. Cleanup po testach
```javascript
// ✅ Poprawnie
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// ❌ Niepoprawnie
// Brak cleanup może powodować wycieki pamięci
```

## 📚 Przydatne zasoby

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

---

**Food 4 Thought Testing** - Zapewniamy jakość kodu poprzez kompleksowe testy! 🧪✅ 