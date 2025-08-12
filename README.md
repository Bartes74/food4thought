# Food 4 Thought 🎧

Aplikacja do zarządzania podcastami i odcinkami audio z systemem osiągnięć i statystyk.

## 🚀 Funkcje

- **Zarządzanie seriami** - dodawanie, edycja i usuwanie serii podcastów
- **Zarządzanie odcinkami** - dodawanie odcinków z metadanymi, tematami i linkami
- **System ulubionych** - dodawanie odcinków do ulubionych z wyszukiwaniem
- **Statystyki użytkownika** - śledzenie postępów i historii słuchania
- **System osiągnięć** - 19 unikalnych odznak za różne aktywności
- **Panel administratora** - zarządzanie użytkownikami i statystykami
- **Responsywny design** - aplikacja działa na wszystkich urządzeniach
- **Ciemny/jasny motyw** - wybór preferowanego wyglądu
- **Wielojęzyczność** - obsługa polskiego i angielskiego
- **Automatyczne ładowanie ostatniego odcinka** - po zalogowaniu

## 🛠️ Technologie

- **Frontend**: React 18, Vite 6, Tailwind CSS
- **Backend**: Node.js 24, Express.js 4
- **Baza danych**: SQLite 3 z WAL mode
- **Autoryzacja**: JWT (JSON Web Tokens)
- **Testy**: Jest, Supertest, Playwright (E2E)
- **Narzędzia**: Nodemon, ESLint, Prettier

## 📦 Instalacja

### Wymagania
- Node.js 18+ 
- npm 9+

### Kroki instalacji

1. **Klonowanie repozytorium**
```bash
git clone https://github.com/Bartes74/food4thought.git
cd food4thought
```

2. **Instalacja zależności**
```bash
npm install
```

3. **Konfiguracja środowiska**
```bash
cp .env.example .env
# Edytuj .env i ustaw JWT_SECRET
```

4. **Inicjalizacja bazy danych**
```bash
npm run db:init
```

## 🚀 Uruchamianie

### Tryb deweloperski
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend  
npm run client
```

### Tryb produkcyjny
```bash
npm run build
npm start
```

## 📱 Dostęp do aplikacji

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Dokumentacja API**: http://localhost:3001/api/docs

## 👤 Konta testowe

- **Administrator**: `admin@food4thought.local` / `admin`
- **Użytkownik testowy**: `test@example.com` / `test123`

## 🔧 Nowe funkcjonalności (v2.1)

### Uproszczona logika statusów odcinków
Aplikacja używa teraz tylko tabeli `user_progress` do określania statusu odcinków:

```javascript
// Nowe pola w user_progress
{
  user_position: 300,        // Pozycja w sekundach
  user_completed: 0,         // 0 = nieukończony, 1 = ukończony
  user_last_played: '2024-01-01T00:00:00Z'  // Ostatnie słuchanie
}

// Logika statusów:
// - Nowy: brak wpisu w user_progress
// - W trakcie: user_position > 0 && user_completed = 0
// - Ukończony: user_completed = 1
```

### Automatyczne ładowanie ostatniego odcinka
- Po zalogowaniu aplikacja automatycznie ładuje ostatnio słuchany odcinek
- Endpoint `/api/episodes/last-played` zwraca najnowszy odcinek z `user_progress`
- Player zapamiętuje pozycję odtwarzania

### Struktura odcinków użytkownika
Endpoint `/api/episodes/my` zwraca obiekt z trzema kategoriami:
```javascript
{
  new: [...],           // Nowe odcinki (brak wpisu w user_progress)
  inProgress: [...],    // Odcinki w trakcie słuchania (user_position > 0)
  completed: [...]      // Ukończone odcinki (user_completed = 1)
}
```

### System ulubionych
- Endpoint `/api/episodes/favorites` z wyszukiwaniem
- Informacje o dacie dodania do ulubionych
- Grupowanie ulubionych według serii

### Cascade Delete
- Usuwanie odcinków i serii usuwa wszystkie powiązane dane
- Zachowanie integralności bazy danych

### Informacje o serii
Wszystkie endpointy odcinków zawierają:
- `series_name` - Nazwa serii
- `series_color` - Kolor serii  
- `series_image` - Obraz serii

### System osiągnięć (Naprawiony)
- **19 unikalnych osiągnięć** (poprawiono z 1928 duplikatów)
- Automatyczne odblokowywanie na podstawie aktywności
- Śledzenie postępu w czasie rzeczywistym
- Kategorie: słuchanie, oceny, ulubione, serie

## 📊 API Endpoints

### Autoryzacja
- `POST /api/auth/login` - Logowanie
- `POST /api/auth/register` - Rejestracja
- `GET /api/auth/me` - Informacje o użytkowniku

### Odcinki
- `GET /api/episodes/my` - Odcinki użytkownika (nowa struktura)
- `GET /api/episodes/favorites` - Ulubione odcinki
- `GET /api/episodes/my/top-rated` - Najwyżej oceniane
- `GET /api/episodes/:id` - Szczegóły odcinka
- `GET /api/episodes/last-played` - Ostatnio słuchany odcinek
- `POST /api/episodes/:id/progress` - Zapisywanie postępu
- `POST /api/episodes/:id/favorite` - Dodawanie do ulubionych
- `DELETE /api/episodes/:id/favorite` - Usuwanie z ulubionych
- `POST /api/episodes/:id/rating` - Ocena odcinka
- `GET /api/episodes/:id/rating` - Pobieranie oceny użytkownika
- `GET /api/episodes/:id/average-rating` - Średnia ocena odcinka
- `DELETE /api/episodes/:id` - Usuwanie odcinka (admin)

### Serii
- `GET /api/series` - Lista serii
- `GET /api/series/:id` - Szczegóły serii
- `DELETE /api/series/:id` - Usuwanie serii (admin)

### Statystyki
- `GET /api/users/:id/stats` - Statystyki użytkownika
- `GET /api/users/series-stats` - Statystyki serii
- `GET /api/achievements` - Osiągnięcia użytkownika

### Administrator
- `GET /api/admin/stats` - Statystyki systemu
- `GET /api/admin/users` - Lista użytkowników
- `POST /api/admin/users` - Tworzenie użytkowników
- `PUT /api/admin/users/:id/role` - Zmiana roli
- `DELETE /api/admin/users/:id` - Usuwanie użytkowników

### Osiągnięcia
- `POST /api/achievements/record-session` - Zapisywanie sesji słuchania

## 🧪 Testy

### Uruchamianie testów
```bash
# Wszystkie testy
npm test

# Testy z pokryciem
npm run test:coverage

# Testy E2E (Playwright)
npm run test:e2e

# Konkretne testy
npm test -- --grep "Episodes"
```

### Struktura testów
- `src/server/__tests__/` - Testy backendu (Jest)
- `src/client/__tests__/e2e/` - Testy E2E (Playwright)
- `playwright/` - Konfiguracja Playwright

### Status testów
- **Backend**: 152/152 testów przechodzi (100%) ✅
- **E2E**: Wszystkie testy przechodzi ✅
- **Pokrycie**: Kompletne pokrycie funkcjonalności

## 🗄️ Baza danych

### Tabeli
- `users` - Użytkownicy i role
- `series` - Serii podcastów
- `episodes` - Odcinki z metadanymi
- `user_progress` - Postęp użytkownika (pozycja, ukończenie, ostatnie słuchanie)
- `listening_sessions` - Sesje słuchania (dla osiągnięć)
- `user_favorites` - Ulubione odcinki
- `ratings` - Oceny odcinków
- `achievements` - 19 unikalnych osiągnięć
- `user_achievements` - Osiągnięcia użytkowników

### Struktura user_progress
```sql
CREATE TABLE user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  episode_id INTEGER NOT NULL,
  position INTEGER DEFAULT 0,        -- Pozycja w sekundach
  completed INTEGER DEFAULT 0,       -- 0 = nieukończony, 1 = ukończony
  last_played DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
  UNIQUE(user_id, episode_id)
);
```

### Migracje
```bash
npm run db:migrate
npm run db:seed
```

### Naprawa duplikatów osiągnięć
Aplikacja zawiera skrypt `fix_achievements_duplicates.sql` do naprawy duplikatów w tabeli osiągnięć:
```sql
-- Usuń duplikaty osiągnięć, zostawiając tylko pierwszy z każdej grupy
DELETE FROM achievements
WHERE id NOT IN (
  SELECT MIN(id)
  FROM achievements
  GROUP BY name, requirement_type, requirement_value
);

-- Usuń osierocone rekordy w user_achievements
DELETE FROM user_achievements
WHERE achievement_id NOT IN (SELECT id FROM achievements);
```

## 🔒 Bezpieczeństwo

- **JWT Tokens** - Bezpieczna autoryzacja
- **Hashowanie haseł** - bcrypt z salt
- **CORS** - Konfigurowalne origins
- **Rate Limiting** - Ochrona przed spamem
- **Input Validation** - Walidacja danych wejściowych
- **SQL Injection Protection** - Parametryzowane zapytania

## 🚀 Deployment

### Docker
```bash
docker build -t food4thought .
docker run -p 3000:3000 food4thought
```

### Vercel/Netlify
```bash
npm run build
# Wgraj folder dist/
```

### VPS
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork projektu
2. Utwórz branch: `git checkout -b feature/nazwa-funkcji`
3. Commit zmiany: `git commit -m 'Dodaj funkcję'`
4. Push do branch: `git push origin feature/nazwa-funkcji`
5. Otwórz Pull Request

## 📝 Licencja

MIT License - zobacz [LICENSE](LICENSE) dla szczegółów.

## 🐛 Raportowanie błędów

Użyj [GitHub Issues](https://github.com/Bartes74/food4thought/issues) do raportowania błędów i sugestii.

## 📞 Wsparcie

- **Email**: support@food4thought.local
- **Discord**: [Serwer wsparcia](https://discord.gg/food4thought)
- **Dokumentacja**: [Wiki](https://github.com/Bartes74/food4thought/wiki)

## 🎯 Roadmap

### v2.2 (Następna wersja)
- [ ] System powiadomień
- [ ] Eksport danych
- [ ] Integracja z Spotify
- [ ] Mobile app (React Native)

### v2.3
- [ ] System komentarzy
- [ ] Playlisty
- [ ] Synchronizacja między urządzeniami
- [ ] API dla zewnętrznych aplikacji

## 🔧 Ostatnie naprawy

### Uproszczenie logiki statusów (v2.1.0)
- **Problem**: Skomplikowana logika używająca wielu tabel do określania statusu odcinków
- **Rozwiązanie**: Uproszczenie do używania tylko tabeli `user_progress`
- **Rezultat**: Szybsze zapytania, prostsza logika, lepsza wydajność
- **Pola**: `user_position`, `user_completed`, `user_last_played`

### Naprawa testów (v2.0.1)
- **Backend**: 152/152 testów przechodzi (100%)
- **E2E**: Wszystkie testy Playwright przechodzi
- **Dostosowano**: Testy do nowej logiki `user_progress`
- **Dodano**: Minimalny test do `test-app-simplified.js`

### Naprawa duplikatów osiągnięć (v2.0.0)
- **Problem**: Baza danych zawierała 1928 duplikatów osiągnięć zamiast 19 unikalnych
- **Rozwiązanie**: Usunięto duplikaty i osierocone rekordy
- **Rezultat**: Poprawna liczba osiągnięć (19) wyświetlana w UI
- **Skrypt**: `fix_achievements_duplicates.sql` do przyszłej naprawy

### Naprawa testów (v2.0.0)
- **Backend**: 142/142 testów przechodzi (100%)
- **E2E**: Wszystkie testy Playwright przechodzi
- **Dodano**: `data-testid` atrybuty dla lepszego testowania
- **Poprawiono**: Konfigurację Playwright i timeouty

---

**Food 4 Thought** - Twój osobisty menedżer podcastów! 🎧✨ 