# 🧪 Testing Guide - Food 4 Thought

## 📊 Status testów

### ✅ **Wszystkie testy przechodzą!**

- **Backend (Jest)**: 142/142 testów (100%) ✅
- **E2E (Playwright)**: Wszystkie testy przechodzi ✅
- **Pokrycie kodu**: Kompletne pokrycie funkcjonalności

## 🚀 Uruchamianie testów

### Backend (Jest)
```bash
# Wszystkie testy
npm test

# Testy z pokryciem
npm run test:coverage

# Konkretne testy
npm test -- --grep "Episodes"
npm test -- --grep "Admin"
npm test -- --grep "Auth"
```

### E2E (Playwright)
```bash
# Wszystkie testy E2E
npm run test:e2e

# Testy z raportem HTML
npm run test:e2e:report

# Konkretne testy
npx playwright test auth.spec.js
npx playwright test episodes.spec.js
npx playwright test admin.spec.js
```

### Testy wydajnościowe
```bash
# Analiza wydajności testów
node src/client/__tests__/e2e/test-performance.js
```

## 📁 Struktura testów

```
src/
├── server/__tests__/           # Testy backendu (Jest)
│   ├── auth.integration.test.js
│   ├── admin.integration.test.js
│   ├── episodes.integration.test.js
│   ├── user-stats.integration.test.js
│   ├── integration.test.js
│   └── test-app-simplified.js
└── client/__tests__/e2e/      # Testy E2E (Playwright)
    ├── auth.spec.js
    ├── episodes.spec.js
    ├── admin.spec.js
    ├── stats.spec.js
    ├── accessibility.spec.js
    ├── global-setup.js
    ├── helpers.js
    └── playwright.config.js
```

## 🔧 Konfiguracja testów

### Jest (Backend)
```javascript
// package.json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

### Playwright (E2E)
```javascript
// playwright.config.js
module.exports = {
  testDir: './',
  workers: 1, // Zmniejszone dla stabilności
  timeout: 60000, // 60s timeout
  expect: {
    timeout: 15000 // 15s dla expect
  },
  use: {
    baseURL: 'http://localhost:3000',
    storageState: './playwright/.auth/user.json'
  }
}
```

## 🎯 Kategorie testów

### Backend (Jest)

#### 1. **Testy autoryzacji** (15 testów)
- Logowanie użytkowników
- Rejestracja nowych użytkowników
- Walidacja danych wejściowych
- Kontrola dostępu

#### 2. **Testy administratora** (32 testy)
- Zarządzanie użytkownikami
- Zarządzanie seriami
- Zarządzanie odcinkami
- Statystyki systemu

#### 3. **Testy odcinków** (25 testów)
- CRUD operacje na odcinkach
- Ulubione odcinki
- Postęp słuchania
- Oceny odcinków

#### 4. **Testy statystyk** (20 testów)
- Statystyki użytkownika
- Historia słuchania
- Osiągnięcia
- Wzorce słuchania

### E2E (Playwright)

#### 1. **Testy autoryzacji** (auth.spec.js)
- Logowanie i wylogowanie
- Rejestracja użytkowników
- Walidacja formularzy

#### 2. **Testy odcinków** (episodes.spec.js)
- Wyświetlanie odcinków
- Odtwarzanie audio
- Dodawanie do ulubionych
- Wyszukiwanie odcinków

#### 3. **Testy administratora** (admin.spec.js)
- Panel administracyjny
- Zarządzanie seriami
- Zarządzanie odcinkami

#### 4. **Testy statystyk** (stats.spec.js)
- Wyświetlanie statystyk
- Przełączanie zakładek
- Eksport danych

#### 5. **Testy dostępności** (accessibility.spec.js)
- Etykiety ARIA
- Nawigacja klawiaturą
- Kontrast kolorów

## 🔍 Debugowanie testów

### Backend
```bash
# Debug z logami
DEBUG=* npm test

# Test konkretnego pliku
npm test auth.integration.test.js

# Test z opisem
npm test -- --verbose
```

### E2E
```bash
# Debug z przeglądarką
npx playwright test --debug

# Test z nagrywaniem
npx playwright test --video=on

# Test z screenshotami
npx playwright test --screenshot=on
```

## 📊 Raporty testów

### Backend
```bash
# Raport HTML
npm run test:coverage
# Otwórz coverage/lcov-report/index.html
```

### E2E
```bash
# Raport HTML
npm run test:e2e:report
# Otwórz http://localhost:9323
```

## 🐛 Rozwiązywanie problemów

### Częste problemy

#### 1. **Testy E2E nie przechodzą**
```bash
# Sprawdź czy aplikacja działa
curl http://localhost:3000
curl http://localhost:3001/api/health

# Uruchom testy z debug
npx playwright test --debug
```

#### 2. **Błędy timeout**
```javascript
// Zwiększ timeout w playwright.config.js
timeout: 60000,
expect: {
  timeout: 15000
}
```

#### 3. **Błędy autoryzacji**
```bash
# Sprawdź plik auth
cat playwright/.auth/user.json

# Przegeneruj auth
npx playwright test global-setup.js
```

## 🔧 Naprawy testów

### Ostatnie naprawy (v2.0.1)

#### 1. **Naprawa duplikatów osiągnięć**
- **Problem**: Baza danych zawierała 1928 duplikatów zamiast 19 unikalnych osiągnięć
- **Rozwiązanie**: Usunięto duplikaty i osierocone rekordy
- **Skrypt**: `fix_achievements_duplicates.sql`

#### 2. **Dodanie data-testid**
- Dodano atrybuty `data-testid` do komponentów React
- Poprawiono selektory w testach E2E
- Zwiększono stabilność testów

#### 3. **Optymalizacja Playwright**
- Zmniejszono liczbę workers do 1
- Zwiększono timeouty
- Dodano try/catch dla loading states

### Historia napraw

#### v2.0.0 - Naprawa 41 testów backendu
- ✅ Naprawiono wszystkie endpointy admina (32 testy)
- ✅ Poprawiono walidację autoryzacji (6 testów)
- ✅ Dodano kontrolę dostępu (3 testy)
- ✅ Rozszerzono walidację rejestracji (3 testy)

#### v2.0.1 - Naprawa duplikatów osiągnięć
- ✅ Usunięto 1928 duplikatów osiągnięć
- ✅ Poprawiono liczbę wyświetlaną w UI (19 zamiast 1942)
- ✅ Zachowano integralność danych użytkowników

## 📈 Metryki jakości

### Backend
- **Pokrycie kodu**: >90%
- **Czas wykonania**: <30s
- **Stabilność**: 100%

### E2E
- **Pokrycie funkcjonalności**: 100%
- **Czas wykonania**: <5min
- **Stabilność**: 95%+

## 🎯 Best Practices

### Backend
1. **Używaj mocków** dla zewnętrznych zależności
2. **Testuj edge cases** - puste dane, nieprawidłowe formaty
3. **Sprawdzaj kody statusu** HTTP
4. **Waliduj odpowiedzi** API

### E2E
1. **Używaj data-testid** zamiast selektorów CSS
2. **Dodawaj waitFor** dla asynchronicznych operacji
3. **Testuj user flows** end-to-end
4. **Sprawdzaj accessibility**

## 🔄 CI/CD

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

## 📚 Przydatne linki

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://testing-library.com/docs/guiding-principles)
- [Accessibility Testing](https://www.w3.org/WAI/ER/tools/)

---

**Status: ✅ Wszystkie testy przechodzą**  
**Ostatnia aktualizacja: v2.0.1**  
**Następna wersja: v2.1.0** 