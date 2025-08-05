# 🧪 Instrukcje Testowania - Food4Thought

## 📋 Przegląd

Ten dokument zawiera szczegółowe instrukcje testowania aplikacji Food4Thought, aby uniknąć regresji i zapewnić wysoką jakość kodu.

## 🚀 Szybkie testy (5 minut)

### 1. Uruchom aplikację
```bash
./start.sh
```

### 2. Sprawdź podstawowe funkcjonalności
- [ ] Otwórz http://localhost:3000
- [ ] Zaloguj się jako admin (`admin@food4thought.local` / `admin123`)
- [ ] Sprawdź czy strona główna się ładuje
- [ ] Sprawdź czy menu nawigacyjne działa
- [ ] Sprawdź czy statystyki admina się ładują (`/admin-stats`)

### 3. Sprawdź krytyczne funkcje
- [ ] Player audio - kliknij w odcinek
- [ ] **System oceniania** - oceń odcinek w playerze
- [ ] Ulubione - dodaj/usuń odcinek z ulubionych
- [ ] Osiągnięcia - sprawdź stronę `/achievements`
- [ ] Zarządzanie - sprawdź `/series` i `/episodes`

## 🔍 Szczegółowe testy (15-30 minut)

### Testy manualne

#### 1. Logowanie i autoryzacja
```bash
# Test 1: Logowanie administratora
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@food4thought.local","password":"admin123"}'

# Test 2: Sprawdzenie tokenu
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <token>"
```

#### 2. Statystyki administratora
```bash
# Test 1: Pobranie statystyk
curl -X GET http://localhost:3001/api/admin-stats/stats \
  -H "Authorization: Bearer <admin-token>"

# Test 2: Różne zakresy czasowe
curl -X GET "http://localhost:3001/api/admin-stats/stats?range=today" \
  -H "Authorization: Bearer <admin-token>"
```

#### 3. System oceniania ⭐ **NOWE**
```bash
# Test 1: Dodanie oceny
curl -X POST http://localhost:3001/api/episodes/1/rating \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'

# Test 2: Pobranie oceny użytkownika
curl -X GET http://localhost:3001/api/episodes/1/rating \
  -H "Authorization: Bearer <token>"

# Test 3: Pobranie średniej oceny
curl -X GET http://localhost:3001/api/episodes/1/average-rating \
  -H "Authorization: Bearer <token>"

# Test 4: Najwyżej oceniane odcinki użytkownika
curl -X GET http://localhost:3001/api/episodes/my/top-rated \
  -H "Authorization: Bearer <token>"
```

#### 4. Zarządzanie treścią
```bash
# Test 1: Pobranie serii
curl -X GET http://localhost:3001/api/series \
  -H "Authorization: Bearer <token>"

# Test 2: Pobranie odcinków
curl -X GET http://localhost:3001/api/episodes/my \
  -H "Authorization: Bearer <token>"
```

### Testy automatyczne

#### Uruchomienie testów
```bash
# Wszystkie testy
npm test

# Tylko testy backendu
npm run test:backend

# Testy w trybie watch
npm run test:watch
```

#### Dodanie nowych testów
1. Utwórz plik `src/server/__tests__/nazwa.test.js`
2. Użyj wzorca z istniejących testów
3. Mockuj zależności (baza danych, middleware)
4. Testuj happy path i edge cases

## 🐛 Debugowanie

### Błędy backendu
```bash
# Sprawdź logi
tail -f logs/security.log

# Sprawdź procesy
ps aux | grep node

# Sprawdź porty
lsof -i :3001
lsof -i :3000
```

### Błędy frontendu
1. Otwórz DevTools (F12)
2. Sprawdź Console na błędy JavaScript
3. Sprawdź Network na błędy API
4. Sprawdź React DevTools na problemy z komponentami

### Błędy bazy danych
```bash
# Sprawdź plik bazy danych
ls -la food4thought.db

# Sprawdź uprawnienia
chmod 644 food4thought.db

# Backup przed testami
cp food4thought.db food4thought.db.backup
```

## 📊 Metryki jakości

### Pokrycie testami
```bash
# Generuj raport pokrycia
npm run test:backend -- --coverage

# Otwórz raport HTML
open coverage/lcov-report/index.html
```

### Wydajność
```bash
# Test czasu odpowiedzi API
time curl -X GET http://localhost:3001/api/health

# Test ładowania strony
# Użyj DevTools Network tab
```

## 🔄 CI/CD Pipeline

### Przed commitem
```bash
# Uruchom testy
npm test

# Sprawdź linting (jeśli dodany)
npm run lint

# Sprawdź formatowanie (jeśli dodany)
npm run format
```

### Przed wdrożeniem
1. Przejdź przez pełną checklistę w `CHECKLIST.md`
2. Uruchom testy automatyczne
3. Sprawdź testy manualne na staging
4. Sprawdź logi pod kątem błędów

## 🎯 Najczęstsze problemy

### 1. Błędy SQL w statystykach admina
**Objawy:** `misuse of aggregate function COUNT()`
**Rozwiązanie:** Sprawdź zapytania SQL w `src/server/routes/adminStats.js`

### 2. Błędy 404 dla endpointów
**Objawy:** `Failed to load resource: net::ERR_CONNECTION_REFUSED`
**Rozwiązanie:** Sprawdź czy endpointy mają `/api/` prefix

### 3. Grafiki się nie wyświetlają
**Objawy:** Brak obrazów w playerze/panelach
**Rozwiązanie:** Sprawdź czy ścieżki są względne (nie hardcoded localhost:3002)

### 4. Backend się nie uruchamia
**Objawy:** `EADDRINUSE: address already in use :::3001`
**Rozwiązanie:** Zabij proces na porcie 3001

### 5. Problemy z ocenianiem ⭐ **NOWE**
**Objawy:** Oceny się nie zapisują, opóźnienia w interfejsie
**Rozwiązanie:** 
- Sprawdź token JWT (może wygasł)
- Sprawdź endpoint `/api/episodes/:id/rating`
- Sprawdź logi w konsoli przeglądarki
- Sprawdź czy baza danych ma tabelę `ratings`

### 6. Błędy 404 dla `/api/users/series-stats`
**Objawy:** `Failed to load resource: the server responded with a status of 404`
**Rozwiązanie:** Sprawdź kolejność routów w `src/server/routes/users.js` - `/series-stats` musi być przed `/:id`

### 7. Błędy 429 (Too Many Requests)
**Objawy:** `Failed to load resource: the server responded with a status of 429`
**Rozwiązanie:** Rate limiting został zwiększony do 500 requestów/15min, sprawdź czy serwer został zrestartowany

## 📝 Raportowanie błędów

### Szablon raportu błędu
```
**Opis problemu:**
Krótki opis co się dzieje

**Kroki do reprodukcji:**
1. Otwórz aplikację
2. Zaloguj się jako admin
3. Przejdź do /admin-stats
4. Zobacz błąd

**Oczekiwane zachowanie:**
Co powinno się stać

**Rzeczywiste zachowanie:**
Co się dzieje

**Informacje techniczne:**
- Przeglądarka: Chrome 120
- OS: macOS 14.0
- Wersja aplikacji: 1.1.0
- Logi z konsoli: [wklej logi]

**Załączniki:**
- Screenshot błędu
- Logi z DevTools
```

## 🚀 Automatyzacja testów

### Testy E2E (Playwright) ✅ ZREALIZOWANE
```bash
# Instalacja Playwright
npx playwright install

# Uruchomienie testów E2E (58 testów)
npm run test:e2e

# Szybkie testy (4 workers)
npm run test:e2e:fast

# Testy na wszystkich przeglądarkach
npm run test:e2e:all-browsers

# Analiza wydajności testów
npm run test:e2e:performance
```

### Optymalizacje wydajności
- **Global setup**: Pre-login admin user (oszczędza ~30s na test)
- **Parallel execution**: Testy uruchamiane równolegle
- **Reduced timeouts**: Szybsze timeouty dla lepszej wydajności
- **Selective screenshots/videos**: Tylko przy błędach
- **Cached authentication**: Zapisywanie stanu sesji

### Statystyki wydajności
- **Przed optymalizacją**: ~2.6 minuty
- **Po optymalizacji**: ~1.5 minuty (cel: <1 minuta)
- **Najwolniejsze testy**: Statystyki (30s) - wymagają optymalizacji
- **Najszybsze testy**: Autoryzacja, dostępność (<1s)

### Testy wydajnościowe (planowane)
```bash
# Instalacja Artillery
npm install artillery --save-dev

# Test obciążenia API
npx artillery run tests/load-test.yml
```

## 📚 Przydatne narzędzia

### Narzędzia testowe
- **Jest** - testy jednostkowe
- **Supertest** - testy API
- **Cypress** - testy E2E (planowane)
- **Artillery** - testy wydajnościowe (planowane)

### Narzędzia debugowania
- **DevTools** - debugowanie frontendu
- **Postman** - testowanie API
- **SQLite Browser** - przeglądanie bazy danych
- **curl** - testowanie endpointów

## 🤝 Współpraca

### Code Review Checklist
- [ ] Kod przechodzi wszystkie testy
- [ ] Nowe funkcjonalności mają testy
- [ ] Dokumentacja jest zaktualizowana
- [ ] Checklista testowa została przejścia
- [ ] Brak regresji w istniejących funkcjach

### Pair Programming
1. Jeden programista koduje
2. Drugi przechodzi przez checklistę testową
3. Oboje sprawdzają wyniki testów
4. Wspólnie debugują problemy

## 🔧 Ostatnie naprawy (2025-01-05)

### Naprawione problemy:
- ✅ **Routing**: Naprawiono konflikt `/series-stats` vs `/:id` w `src/server/routes/users.js`
- ✅ **useEffect**: Rozwiązano problem z `fetchStats` przez `useRef` w `StatsPage.jsx`
- ✅ **Rate limiting**: Zwiększono do 500 requestów/15min w `src/server/index.js`
- ✅ **Ocenianie**: Zoptymalizowano zapytania SQL i dodano indeksy w `src/server/database.js`
- ✅ **Synchronizacja**: Globalne eventy dla aktualizacji komponentów
- ✅ **Testy automatyczne**: Dodano kompleksowy system testów integracyjnych (21 testów)
- ✅ **Walidacja**: Naprawiono walidację `confirmPassword` w rejestracji
- ✅ **Testy E2E**: Dodano kompletny system testów end-to-end z Playwright (58 testów)
- ✅ **Responsywność**: Testy dla mobile, tablet, desktop
- ✅ **Dostępność**: Testy ARIA, klawiatury, screen reader
- ✅ **CI/CD**: Dodano pipeline GitHub Actions z automatycznymi testami
- ✅ **Optymalizacja**: Global setup, parallel execution, cached authentication
- ✅ **Analiza wydajności**: Narzędzie do analizy czasu wykonania testów
- ✅ **Wydajność**: UPSERT dla szybkiego zapisu ocen

### Nowe funkcjonalności:
- ⭐ **System oceniania**: 5 gwiazdek w playerze i na liście odcinków
- ⭐ **Sortowanie**: Sortowanie odcinków według ocen
- ⭐ **Statystyki**: Tab "Oceny" w statystykach użytkownika
- ⭐ **Synchronizacja**: Natychmiastowe odświeżanie po ocenieniu

---

**Pamiętaj:** Testowanie to inwestycja w jakość. Lepiej spędzić 30 minut na testach niż 3 godziny na debugowaniu w produkcji! 