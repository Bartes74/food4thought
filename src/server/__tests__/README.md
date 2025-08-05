# Testy Integracyjne Backendu

Ten katalog zawiera kompleksowe testy integracyjne dla API Food4Thought.

## 📁 Struktura plików

```
__tests__/
├── setup.js                    # Konfiguracja i pomocnicze funkcje testowe
├── test-app.js                 # Aplikacja Express dla testów (bez uruchamiania serwera)
├── auth.integration.test.js    # Testy endpointów autoryzacji
├── episodes.integration.test.js # Testy endpointów odcinków
├── user-stats.integration.test.js # Testy statystyk użytkownika
├── admin.integration.test.js   # Testy endpointów administratora
├── integration.test.js         # Główny plik uruchamiający wszystkie testy
└── README.md                   # Ta dokumentacja
```

## 🚀 Uruchamianie testów

### Wszystkie testy integracyjne
```bash
npm run test:integration
```

### Testy jednostkowe (bez integracyjnych)
```bash
npm run test:unit
```

### Wszystkie testy backendu
```bash
npm run test:backend
```

### Testy z pokryciem kodu
```bash
npm run test:coverage
```

### Testy w trybie watch
```bash
npm run test:watch
```

## 🧪 Rodzaje testów

### 1. Testy Autoryzacji (`auth.integration.test.js`)
- **POST /api/auth/login** - logowanie użytkowników
- **GET /api/auth/me** - pobieranie informacji o użytkowniku
- **POST /api/auth/register** - rejestracja nowych użytkowników

**Testowane scenariusze:**
- ✅ Poprawne logowanie administratora i użytkownika
- ✅ Walidacja brakujących danych
- ✅ Obsługa nieprawidłowych poświadczeń
- ✅ Walidacja tokenów JWT
- ✅ Rejestracja z walidacją hasła

### 2. Testy Odcinków (`episodes.integration.test.js`)
- **GET /api/episodes/my** - lista odcinków użytkownika
- **GET /api/episodes/:id** - szczegóły odcinka
- **POST /api/episodes/:id/progress** - zapisywanie postępu
- **POST /api/episodes/:id/favorite** - dodawanie/usuwanie z ulubionych
- **POST /api/episodes/:id/rating** - ocenianie odcinków
- **GET /api/episodes/:id/rating** - pobieranie oceny użytkownika
- **GET /api/episodes/:id/average-rating** - średnia ocena odcinka
- **GET /api/episodes/my/top-rated** - najwyżej oceniane odcinki

**Testowane scenariusze:**
- ✅ Pobieranie odcinków dla zalogowanego użytkownika
- ✅ Zapisywanie i aktualizacja postępu słuchania
- ✅ Zarządzanie ulubionymi odcinkami
- ✅ System oceniania (dodawanie, aktualizacja, walidacja)
- ✅ Obsługa błędów autoryzacji

### 3. Testy Statystyk Użytkownika (`user-stats.integration.test.js`)
- **GET /api/users/:id/stats** - statystyki użytkownika
- **GET /api/users/series-stats** - statystyki według serii
- **GET /api/users/:id/favorites** - ulubione odcinki
- **PUT /api/users/preferences** - preferencje użytkownika
- **GET /api/achievements** - osiągnięcia użytkownika
- **POST /api/achievements/check** - sprawdzanie nowych osiągnięć
- **GET /api/users/:id/history** - historia słuchania
- **GET /api/users/:id/patterns** - wzorce słuchania

**Testowane scenariusze:**
- ✅ Pobieranie statystyk użytkownika
- ✅ Statystyki według serii
- ✅ Zarządzanie preferencjami
- ✅ System osiągnięć
- ✅ Historia i wzorce słuchania
- ✅ Kontrola dostępu (tylko własne dane)

### 4. Testy Administratora (`admin.integration.test.js`)
- **GET /api/admin/stats** - statystyki systemu
- **GET /api/admin/users** - lista wszystkich użytkowników
- **POST /api/admin/users** - tworzenie użytkowników
- **PUT /api/admin/users/:id/role** - zmiana roli użytkownika
- **POST /api/admin/users/:id/reset-password** - reset hasła
- **DELETE /api/admin/users/:id** - usuwanie użytkowników
- **GET /api/admin/series** - lista serii
- **GET /api/admin/episodes** - lista odcinków

**Testowane scenariusze:**
- ✅ Dostęp tylko dla super administratora
- ✅ Zarządzanie użytkownikami (CRUD)
- ✅ Zmiana ról użytkowników
- ✅ Resetowanie haseł
- ✅ Statystyki systemu
- ✅ Kontrola dostępu (403 dla zwykłych użytkowników)

## 🔧 Konfiguracja testów

### Plik `setup.js`
Zawiera funkcje pomocnicze:
- `setupTests()` - inicjalizacja danych testowych
- `teardownTests()` - czyszczenie po testach
- `cleanupDatabase()` - czyszczenie bazy danych
- `loginAdmin()` - logowanie administratora
- `createTestUser()` - tworzenie testowego użytkownika
- `getTestData()` - pobieranie danych testowych

### Plik `test-app.js`
Oddzielna instancja aplikacji Express dla testów:
- Bez uruchamiania serwera HTTP
- Wszystkie middleware i trasy
- Obsługa błędów

## 📊 Pokrycie testów

Testy pokrywają:
- ✅ **Autoryzacja**: 100% endpointów
- ✅ **Odcinki**: 100% endpointów
- ✅ **Statystyki użytkownika**: 100% endpointów  
- ✅ **Administrator**: 100% endpointów
- ✅ **Walidacja danych**: wszystkie scenariusze
- ✅ **Obsługa błędów**: 401, 403, 404, 400
- ✅ **Kontrola dostępu**: role użytkowników

## 🐛 Debugowanie testów

### Uruchomienie pojedynczego testu
```bash
npm run test:integration -- --testNamePattern="should login admin successfully"
```

### Uruchomienie z dodatkowymi logami
```bash
npm run test:integration -- --verbose
```

### Uruchomienie z pokryciem
```bash
npm run test:coverage
```

## 📝 Dodawanie nowych testów

1. Stwórz nowy plik `nazwa.integration.test.js`
2. Zaimportuj `setup.js` i `test-app.js`
3. Użyj `beforeAll()` i `afterAll()` dla setup/teardown
4. Dodaj import do `integration.test.js`
5. Uruchom testy: `npm run test:integration`

## ⚠️ Ważne uwagi

- Testy używają rzeczywistej bazy danych SQLite
- Dane testowe są czyszczone przed i po testach
- Administrator testowy: `admin@food4thought.local` / `admin123`
- Testy sprawdzają zarówno pozytywne jak i negatywne scenariusze
- Wszystkie endpointy są testowane pod kątem autoryzacji

## 🎯 Cel testów

Testy integracyjne zapewniają:
- **Jakość kodu** - wykrywanie błędów przed wdrożeniem
- **Dokumentację** - przykłady użycia API
- **Refaktoryzację** - bezpieczne zmiany kodu
- **Regresję** - zapobieganie nowym błędom
- **Zaufanie** - pewność działania systemu 