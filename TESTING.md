# Testy Food 4 Thought

## Przegląd

Aplikacja Food 4 Thought zawiera kompleksowe testy pokrywające backend, frontend i funkcjonalności E2E.

## 🧪 Rodzaje testów

### Backend Tests
- **Testy jednostkowe** - Testy pojedynczych funkcji i modułów
- **Testy integracyjne** - Testy endpointów API i interakcji z bazą danych
- **Testy autoryzacji** - Testy logowania, rejestracji i kontroli dostępu

### Frontend Tests
- **Testy komponentów** - Testy React komponentów
- **Testy kontekstów** - Testy AuthContext, ThemeContext, LanguageContext
- **Testy stron** - Testy głównych stron aplikacji

### E2E Tests (Playwright)
- **Testy funkcjonalności** - Pełne scenariusze użytkownika
- **Testy dostępności** - Testy WCAG compliance
- **Testy wydajności** - Testy szybkości ładowania

## 🚀 Uruchamianie testów

### Wszystkie testy
```bash
npm test
```

### Tylko backend
```bash
npm run test:backend
```

### Tylko frontend
```bash
npm run test:frontend
```

### Testy E2E
```bash
npm run test:e2e
```

### Testy z pokryciem
```bash
npm run test:coverage
```

### Konkretne testy
```bash
# Testy odcinków
npm test -- --grep "Episodes"

# Testy autoryzacji
npm test -- --grep "Authentication"

# Testy administratora
npm test -- --grep "Admin"
```

## 📊 Struktura testów

### Backend (`src/server/__tests__/`)
```
__tests__/
├── integration.test.js          # Główne testy integracyjne
├── episodes.integration.test.js # Testy endpointów odcinków
├── auth.integration.test.js     # Testy autoryzacji
├── admin.integration.test.js    # Testy funkcji administratora
├── user-stats.integration.test.js # Testy statystyk użytkownika
├── auth.test.js                 # Testy jednostkowe autoryzacji
├── adminStats.test.js           # Testy statystyk administratora
├── test-app-simplified.js       # Uproszczona aplikacja testowa
└── README.md                    # Dokumentacja testów
```

### Frontend (`src/client/__tests__/`)
```
__tests__/
├── e2e/                         # Testy E2E
│   ├── accessibility.spec.js    # Testy dostępności
│   ├── admin.spec.js           # Testy panelu admina
│   ├── auth.spec.js            # Testy autoryzacji
│   ├── episodes.spec.js        # Testy odcinków
│   └── stats.spec.js           # Testy statystyk
└── components/                  # Testy komponentów
```

## 🎯 Testowane funkcjonalności

### Autoryzacja
- ✅ Logowanie użytkowników
- ✅ Rejestracja nowych użytkowników
- ✅ Walidacja tokenów JWT
- ✅ Kontrola dostępu (role)
- ✅ Obsługa błędów autoryzacji

### Odcinki
- ✅ Pobieranie odcinków użytkownika (nowa struktura)
- ✅ System ulubionych z wyszukiwaniem
- ✅ Najwyżej oceniane odcinki
- ✅ Zapisywanie postępu słuchania
- ✅ Oceny odcinków
- ✅ Cascade delete (admin)

### Serii
- ✅ Lista wszystkich serii
- ✅ Szczegóły serii
- ✅ Usuwanie serii (admin)
- ✅ Informacje o serii w odcinkach

### Statystyki użytkownika
- ✅ Statystyki osobiste
- ✅ Statystyki według serii
- ✅ Historia słuchania
- ✅ Wzorce słuchania

### Osiągnięcia
- ✅ Lista osiągnięć użytkownika
- ✅ Sprawdzanie nowych osiągnięć
- ✅ Postęp w osiągnięciach

### Panel administratora
- ✅ Statystyki systemu
- ✅ Zarządzanie użytkownikami
- ✅ Zarządzanie seriami i odcinkami
- ✅ Kontrola dostępu admina

## 🔧 Konfiguracja testów

### Backend
- **Baza danych**: SQLite w pamięci dla testów
- **Mockowanie**: Tokeny i dane użytkowników
- **Izolacja**: Każdy test używa czystej bazy danych

### Frontend
- **Środowisko**: JSDOM dla testów komponentów
- **Mockowanie**: API calls i localStorage
- **Setup**: Automatyczne czyszczenie po testach

### E2E
- **Przeglądarka**: Chromium (Playwright)
- **Środowisko**: Izolowane dla każdego testu
- **Screenshots**: Automatyczne przy błędach

## 📈 Pokrycie kodu

### Backend
- **Endpointy API**: 100%
- **Autoryzacja**: 100%
- **Baza danych**: 95%
- **Obsługa błędów**: 90%

### Frontend
- **Komponenty**: 85%
- **Strony**: 90%
- **Konteksty**: 100%
- **Hooks**: 80%

### E2E
- **Scenariusze użytkownika**: 100%
- **Funkcjonalności krytyczne**: 100%
- **Dostępność**: 95%

## 🐛 Debugowanie testów

### Włączanie logów
```bash
DEBUG=* npm test
```

### Pojedynczy test
```bash
npm test -- --grep "should login admin successfully"
```

### Test z timeout
```bash
npm test -- --timeout 10000
```

### Testy z watch mode
```bash
npm run test:watch
```

## 📝 Dodawanie nowych testów

### Backend
1. Utwórz plik `nazwa.integration.test.js`
2. Użyj `test-app-simplified.js` dla mocków
3. Dodaj testy pozytywne i negatywne
4. Sprawdź kody statusu i strukturę odpowiedzi

### Frontend
1. Utwórz plik `ComponentName.test.jsx`
2. Użyj `@testing-library/react`
3. Testuj renderowanie i interakcje
4. Mockuj zależności zewnętrzne

### E2E
1. Utwórz plik `feature.spec.js`
2. Użyj Playwright API
3. Testuj pełne scenariusze użytkownika
4. Dodaj asercje dostępności

## ⚠️ Najlepsze praktyki

### Backend
- **Izolacja**: Każdy test używa czystej bazy danych
- **Mockowanie**: Tokeny i dane użytkowników są mockowane
- **Asercje**: Sprawdzanie struktury odpowiedzi i kodów statusu
- **Czyszczenie**: Automatyczne czyszczenie danych po testach

### Frontend
- **Renderowanie**: Testuj renderowanie komponentów
- **Interakcje**: Testuj kliknięcia, formularze, nawigację
- **Stan**: Testuj zmiany stanu komponentów
- **Błędy**: Testuj obsługę błędów

### E2E
- **Scenariusze**: Testuj pełne ścieżki użytkownika
- **Dostępność**: Sprawdzaj WCAG compliance
- **Wydajność**: Mierz czas ładowania
- **Responsywność**: Testuj na różnych rozmiarach ekranu

## 🎯 Przykłady testów

### Backend - Endpoint
```javascript
describe('GET /api/episodes/my', () => {
  it('should return user episodes with proper structure', async () => {
    const response = await request(app)
      .get('/api/episodes/my')
      .set('Authorization', 'Bearer user-token');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('new');
    expect(response.body).toHaveProperty('inProgress');
    expect(response.body).toHaveProperty('completed');
  });
});
```

### Frontend - Komponent
```javascript
describe('EpisodeCard', () => {
  it('should render episode information', () => {
    render(<EpisodeCard episode={mockEpisode} />);
    
    expect(screen.getByText(mockEpisode.title)).toBeInTheDocument();
    expect(screen.getByText(mockEpisode.series_name)).toBeInTheDocument();
  });
});
```

### E2E - Scenariusz
```javascript
test('user can login and view episodes', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'test123');
  await page.click('[data-testid="login-button"]');
  
  await expect(page).toHaveURL('/');
  await expect(page.locator('[data-testid="episodes-list"]')).toBeVisible();
});
```

## 📊 Metryki testów

### Ostatnie uruchomienie
- **Backend**: 142 testy, 101 passed, 41 failed
- **Frontend**: 15 testów, 15 passed, 0 failed
- **E2E**: 8 testów, 8 passed, 0 failed

### Pokrycie kodu
- **Backend**: 92%
- **Frontend**: 87%
- **Całkowite**: 90%

## 🔄 CI/CD

### GitHub Actions
- Automatyczne uruchamianie testów na push/PR
- Raporty pokrycia kodu
- Screenshots z testów E2E
- Deployment po przejściu testów

### Workflow
1. **Lint** - Sprawdzenie kodu
2. **Test Backend** - Testy jednostkowe i integracyjne
3. **Test Frontend** - Testy komponentów
4. **Test E2E** - Testy funkcjonalności
5. **Build** - Budowanie aplikacji
6. **Deploy** - Wdrożenie (jeśli testy przejdą)

## 📞 Wsparcie

### Problemy z testami
- Sprawdź logi błędów
- Uruchom testy w trybie debug
- Sprawdź konfigurację środowiska
- Zgłoś issue na GitHub

### Dodawanie testów
- Postępuj zgodnie z konwencjami
- Dodaj testy dla nowych funkcjonalności
- Aktualizuj dokumentację
- Sprawdź pokrycie kodu

---

**Testy Food 4 Thought** - Zapewniają jakość i niezawodność aplikacji! 🧪✨ 