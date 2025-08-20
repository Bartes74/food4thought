# Testy Food 4 Thought API

## Przegląd

Ten katalog zawiera kompleksowe testy dla API Food 4 Thought, obejmujące testy jednostkowe, integracyjne i end-to-end.

## Struktura testów

### Testy integracyjne
- `integration.test.js` - Główne testy integracyjne API
- `episodes.integration.test.js` - Testy dla endpointów odcinków
- `auth.integration.test.js` - Testy autoryzacji i rejestracji
- `admin.integration.test.js` - Testy funkcji administratora
- `user-stats.integration.test.js` - Testy statystyk użytkownika

### Testy jednostkowe
- `auth.test.js` - Testy jednostkowe autoryzacji
- `adminStats.test.js` - Testy statystyk administratora
- `db-utils.test.js` - Testy narzędzi bazy danych

### Pliki pomocnicze
- `test-app-simplified.js` - Uproszczona aplikacja testowa
- `db-utils.js` - Narzędzia do zarządzania bazą danych testową
- `setup.js` - Konfiguracja środowiska testowego

## Uruchamianie testów

### Wszystkie testy
```bash
npm test
```

### Konkretne testy
```bash
npm test -- --grep "Episodes"
npm test -- --grep "Authentication"
```

### Testy z pokryciem
```bash
npm run test:coverage
```

## Struktura danych testowych

### Użytkownicy testowi
- **Admin**: `admin@food4thought.local` / `admin` (super_admin)
- **Test User**: `test@example.com` / `test123` (user)

### Tokeny testowe
- `admin-token` - Token dla administratora
- `user-token` - Token dla zwykłego użytkownika

## Endpointy testowane

### Autoryzacja
- `POST /api/auth/login` - Logowanie użytkownika
- `POST /api/auth/register` - Rejestracja nowego użytkownika

### Odcinki
- `GET /api/episodes/my` - Odcinki użytkownika (nowa struktura z new/inProgress/completed)
- `GET /api/episodes/favorites` - Ulubione odcinki z informacjami o serii
- `GET /api/episodes/my/top-rated` - Najwyżej oceniane odcinki
- `GET /api/episodes/:id` - Szczegóły odcinka
- `POST /api/episodes/:id/progress` - Zapisywanie postępu
- `POST /api/episodes/:id/favorite` - Dodawanie do ulubionych
- `DELETE /api/episodes/:id/favorite` - Usuwanie z ulubionych
- `POST /api/episodes/:id/rating` - Ocena odcinka
- `DELETE /api/episodes/:id` - Usuwanie odcinka (admin)

### Serii
- `GET /api/series` - Lista wszystkich serii
- `GET /api/series/:id` - Szczegóły serii
- `DELETE /api/series/:id` - Usuwanie serii (admin)

### Statystyki użytkownika
- `GET /api/users/:id/stats` — Statystyki użytkownika (zwraca także `seriesStats` w jednej odpowiedzi)

### Osiągnięcia
- `GET /api/achievements` — Lista osiągnięć użytkownika z polami `progress_value`, `completed` i `earned_at`

## Nowe funkcjonalności testowane

### Struktura odcinków użytkownika
Endpoint `/api/episodes/my` teraz zwraca obiekt z trzema tablicami:
```javascript
{
  new: [...],           // Nowe odcinki
  inProgress: [...],    // Odcinki w trakcie
  completed: [...]      // Ukończone odcinki
}
```

### Informacje o serii
Wszystkie endpointy odcinków zawierają informacje o serii:
- `series_name` - Nazwa serii
- `series_color` - Kolor serii
- `series_image` - Obraz serii

### Automatyczne odtwarzanie
Nowy endpoint `/api/episodes/next/:id` dla automatycznego odtwarzania:
```javascript
{
  nextEpisode: {...},   // Następny odcinek lub null
  message: "string"     // Wiadomość informacyjna
}
```

### AudioUrl w odcinkach
Wszystkie endpointy odcinków zawierają `audioUrl`:
```javascript
{
  id: 1,
  title: "Tytuł odcinka",
  audioUrl: "/audio/seria173/polski/2025_07_31_odcinek01.mp3",
  // ... inne pola
}
```

### Średnia dokładność ukończenia
Nowa kolumna `avg_completion` w statystykach użytkownika:
```javascript
{
  total_listening_time: 3600,
  episodes_completed: 5,
  achievements_earned: 3,
  avg_completion: 0.85  // Nowe pole
}
```

### Rejestrowanie sesji słuchania
Nowy endpoint `/api/achievements/record-session`:
```javascript
{
  episodeId: 1,
  startTime: "2024-01-01T00:00:00Z",
  endTime: "2024-01-01T00:01:00Z",
  playbackSpeed: 1.0,
  completionRate: 0.95,
  durationSeconds: 60
}
```

### Statystyki administratora
Nowe endpointy dla administratora:
- `GET /api/admin/stats` - Statystyki systemu
- `GET /api/admin/users/activity` - Aktywność użytkowników

### Kategorie osiągnięć
Osiągnięcia zawierają kategorie:
```javascript
{
  id: 1,
  name: "Pierwszy krok",
  description: "Ukończono pierwszy odcinek",
  category: "episodes",  // Nowe pole
  progress: 1,
  completed: true
}
```

### System ulubionych
- Endpoint `/api/episodes/favorites` z wyszukiwaniem
- Informacje o dacie dodania do ulubionych (`favorited_at`)

### Cascade Delete
- Usuwanie odcinków i serii usuwa wszystkie powiązane dane
- Testy sprawdzają integralność danych

## Konfiguracja bazy danych testowej

Testy używają bazy danych w pamięci SQLite z następującymi tabelami:
- `users` - Użytkownicy
- `series` - Serii
- `episodes` - Odcinki
- `listening_sessions` - Sesje słuchania
- `user_favorites` - Ulubione odcinki
- `ratings` - Oceny
- `achievements` - Osiągnięcia
- `user_achievements` - Osiągnięcia użytkowników

## Najlepsze praktyki

1. **Izolacja testów** - Każdy test używa czystej bazy danych
2. **Mockowanie** - Tokeny i dane użytkowników są mockowane
3. **Asercje** - Sprawdzanie struktury odpowiedzi i kodów statusu
4. **Czyszczenie** - Automatyczne czyszczenie danych po testach

## Debugowanie testów

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

## Pokrycie kodu

Testy pokrywają:
- ✅ Wszystkie endpointy API
- ✅ Autoryzację i autoryzację
- ✅ Operacje CRUD
- ✅ Walidację danych
- ✅ Obsługę błędów
- ✅ Struktury odpowiedzi

## Dodawanie nowych testów

1. Utwórz plik testowy w odpowiednim katalogu
2. Użyj `test-app-simplified.js` dla testów integracyjnych
3. Dodaj testy dla pozytywnych i negatywnych przypadków
4. Sprawdź strukturę odpowiedzi i kody statusu
5. Dodaj testy dla nowych funkcjonalności

## Przykład nowego testu

```javascript
describe('New Feature', () => {
  it('should work correctly', async () => {
    const response = await request(app)
      .get('/api/new-endpoint')
      .set('Authorization', 'Bearer user-token');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('expected_field');
  });
});
``` 