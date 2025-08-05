# Food4Thought - Aplikacja do słuchania spersonalizowanych podcastów edukacyjnych

## 📋 Spis treści
- [Opis projektu](#opis-projektu)
- [Architektura systemu](#architektura-systemu)
- [Instalacja i uruchomienie](#instalacja-i-uruchomienie)
- [Konfiguracja](#konfiguracja)
- [Struktura bazy danych](#struktura-bazy-danych)
- [API Endpoints](#api-endpoints)
- [Funkcjonalności](#funkcjonalności)
- [System oceniania](#system-oceniania)
- [System osiągnięć](#system-osiągnięć)
- [Panel administratora](#panel-administratora)
- [Bezpieczeństwo](#bezpieczeństwo)
- [Testowanie](#testowanie)
- [Rozwiązywanie problemów](#rozwiązywanie-problemów)
- [Plan rozwoju](#plan-rozwoju)
- [Licencja](#licencja)

## 🎯 Opis projektu

**Food4Thought** to lokalna aplikacja webowa do słuchania spersonalizowanych podcastów edukacyjnych. Aplikacja umożliwia użytkownikom:

- Słuchanie odcinków z różnych serii tematycznych
- Śledzenie postępów w słuchaniu
- Oznaczanie ulubionych odcinków
- **Ocenianie odcinków** (1-5 gwiazdek)
- Earning achievementów za aktywność
- Personalizację doświadczenia poprzez preferencje
- Zarządzanie treściami przez administratorów

### Główne cechy:
- **Personalizacja**: Dostosowanie treści do preferencji użytkownika
- **Śledzenie postępów**: Automatyczne zapisywanie pozycji w odcinkach
- **System oceniania**: Ocenianie odcinków i sortowanie według ocen
- **System osiągnięć**: Motywacyjny system nagród za aktywność
- **Panel administratora**: Kompleksowe zarządzanie treściami i użytkownikami
- **Responsywny design**: Działanie na różnych urządzeniach
- **Tryb ciemny/jasny**: Dostosowanie do preferencji użytkownika

## 🏗️ Architektura systemu

### Stack technologiczny:
- **Backend**: Node.js + Express.js
- **Baza danych**: SQLite3
- **Frontend**: React + Vite
- **Styling**: Tailwind CSS
- **Autoryzacja**: JWT (JSON Web Tokens)
- **Upload plików**: Multer
- **Bezpieczeństwo**: Helmet, bcryptjs, express-rate-limit

### Struktura katalogów:
```
food4thought/
├── src/
│   ├── client/                 # Frontend React
│   │   ├── components/         # Komponenty React (w tym StarRating)
│   │   ├── contexts/           # Context API (Auth, Theme, Language)
│   │   ├── pages/              # Strony aplikacji
│   │   ├── styles/             # Style CSS/Tailwind
│   │   └── locales/            # Tłumaczenia
│   └── server/                 # Backend Node.js
│       ├── routes/             # Endpointy API
│       ├── middleware/         # Middleware (auth, validation)
│       ├── models/             # Modele danych
│       └── utils/              # Narzędzia pomocnicze
├── public/                     # Pliki statyczne
│   ├── audio/                  # Pliki audio odcinków
│   └── series-images/          # Obrazy serii
├── start.sh                    # Skrypt uruchamiania
├── stop.sh                     # Skrypt zatrzymywania
├── CHECKLIST.md               # Lista testów manualnych
├── TESTING.md                 # Instrukcje testowania
└── package.json               # Zależności i skrypty
```

## 🚀 Instalacja i uruchomienie

### Wymagania systemowe:
- Node.js 18+ 
- npm lub yarn
- Git

### Instalacja:
```bash
# Klonowanie repozytorium
git clone <repository-url>
cd food4thought

# Instalacja zależności
npm install

# Uruchomienie aplikacji
./start.sh
```

### Skrypty uruchamiania:
- `./start.sh` - Uruchamia backend i frontend
- `./stop.sh` - Zatrzymuje wszystkie procesy
- `npm run dev` - Uruchamia backend w trybie development

### Testy:
```bash
# Uruchomienie wszystkich testów
npm test

# Testy backendu
npm run test:backend

# Testy integracyjne (podstawowe)
npm run test:simple

# Testy z pokryciem kodu
npm run test:coverage

# Testy w trybie watch
npm run test:watch
```
- `npm run client` - Uruchamia frontend (Vite)
- `npm test` - Uruchamia testy

### Porty:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## ⚙️ Konfiguracja

### Zmienne środowiskowe (.env):
```env
# Porty
PORT=3001
CLIENT_PORT=3000

# Baza danych
DB_PATH=./database.sqlite

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=30d

# Upload
MAX_FILE_SIZE=200MB
UPLOAD_PATH=./public/audio

# Rate limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=500
```

### Domyślne konto administratora:
- **Email**: admin@food4thought.local
- **Hasło**: admin123
- **Rola**: super_admin

⚠️ **WAŻNE**: Zmień hasło po pierwszym logowaniu!

## 🗄️ Struktura bazy danych

### Główne tabele:

#### users
- `id` (PRIMARY KEY)
- `email` (UNIQUE)
- `password_hash`
- `role` (user/admin/super_admin)
- `preferences` (JSON)
- `created_at`
- `last_login`

#### series
- `id` (PRIMARY KEY)
- `name` (UNIQUE)
- `description`
- `color` (hex)
- `image`
- `active` (boolean)
- `created_at`

#### episodes
- `id` (PRIMARY KEY)
- `title`
- `filename`
- `additional_info`
- `series_id` (FOREIGN KEY)
- `date_added`
- `duration`

#### user_progress
- `user_id` (FOREIGN KEY)
- `episode_id` (FOREIGN KEY)
- `position` (seconds)
- `completed` (boolean)
- `last_played`

#### user_favorites
- `user_id` (FOREIGN KEY)
- `episode_id` (FOREIGN KEY)
- `added_at`

#### ratings ⭐ **NOWE**
- `user_id` (FOREIGN KEY)
- `episode_id` (FOREIGN KEY)
- `rating` (1-5)
- `created_at`
- PRIMARY KEY (user_id, episode_id)

#### achievements
- `id` (PRIMARY KEY)
- `name`
- `description`
- `icon`
- `criteria` (JSON)

#### user_achievements
- `user_id` (FOREIGN KEY)
- `achievement_id` (FOREIGN KEY)
- `earned_at`

## 🔌 API Endpoints

### Autoryzacja
- `POST /api/auth/login` - Logowanie
- `POST /api/auth/register` - Rejestracja
- `GET /api/auth/me` - Informacje o użytkowniku
- `POST /api/auth/logout` - Wylogowanie

### Odcinki
- `GET /api/episodes/my` - Odcinki użytkownika (z preferencjami)
- `GET /api/episodes/all` - Wszystkie odcinki
- `GET /api/episodes/favorites` - Ulubione odcinki
- `GET /api/episodes/:id` - Szczegóły odcinka (z oceną użytkownika)
- `POST /api/episodes/:id/progress` - Zapisz postęp
- `POST /api/episodes/:id/favorite` - Dodaj/usuń z ulubionych
- `GET /api/episodes/search` - Wyszukiwanie odcinków

### System oceniania ⭐ **NOWE**
- `GET /api/episodes/:id/rating` - Pobierz ocenę użytkownika
- `POST /api/episodes/:id/rating` - Dodaj/aktualizuj ocenę (1-5)
- `GET /api/episodes/:id/average-rating` - Średnia ocena odcinka
- `GET /api/episodes/my/top-rated` - Najwyżej oceniane odcinki użytkownika

### Serii
- `GET /api/series` - Lista serii
- `GET /api/series/:id` - Szczegóły serii
- `POST /api/series` - Utwórz serię (admin)
- `PUT /api/series/:id` - Edytuj serię (admin)
- `DELETE /api/series/:id` - Usuń serię (admin)

### Panel administratora
- `GET /api/admin-stats/stats` - Statystyki systemu
- `GET /api/admin-stats/test` - Test endpointu admin
- `GET /api/users` - Lista użytkowników (admin)
- `PUT /api/users/preferences` - Aktualizuj preferencje
- `POST /api/users` - Utwórz użytkownika (admin)

### Osiągnięcia
- `GET /api/achievements` - Lista osiągnięć użytkownika
- `POST /api/achievements/check` - Sprawdź i przyznaj osiągnięcia

## 🎮 Funkcjonalności

### Dla użytkowników:

#### Odtwarzacz audio
- **Kontrola odtwarzania**: Play/pause, przewijanie, regulacja głośności
- **Śledzenie postępów**: Automatyczne zapisywanie pozycji
- **Prędkość odtwarzania**: 0.8x - 2.0x
- **Nawigacja tematów**: Przejście do konkretnych fragmentów odcinka
- **Linki do tematów**: Otwieranie w nowej zakładce
- **Ocenianie odcinków**: 5 gwiazdek w prawym górnym rogu

#### System oceniania ⭐ **NOWE**
- **Ocenianie w playerze**: 5 pustych gwiazdek w prawym górnym rogu playeru
- **Średnie oceny**: 5 złotych gwiazdek na liście odcinków (całe i pół gwiazdki)
- **Sortowanie**: Sortowanie odcinków według ocen (od najwyższej)
- **Statystyki**: Lista najwyżej ocenianych odcinków w profilu użytkownika
- **Natychmiastowe odświeżanie**: Lista odcinków i statystyki aktualizują się po ocenieniu

#### Personalizacja
- **Preferencje serii**: Wybór interesujących serii
- **Język audio**: Polski/English/Français
- **Autoplay**: Automatyczne przejście do następnego odcinka
- **Tryb ciemny/jasny**: Dostosowanie interfejsu

#### System ulubionych
- **Dodawanie/usuwaanie**: Oznaczanie ulubionych odcinków
- **Lista ulubionych**: Dedykowana strona z ulubionymi
- **Wyszukiwanie**: Filtrowanie ulubionych

#### Historia słuchania
- **Ostatnio słuchane**: Lista ostatnich odcinków
- **Postęp**: Informacje o ukończonych odcinkach
- **Statystyki**: Czas słuchania, liczba odcinków

### Dla administratorów:

#### Zarządzanie treściami
- **Dodawanie serii**: Upload obrazów, ustawianie kolorów
- **Dodawanie odcinków**: Upload plików MP3, opisy, linki
- **Edytowanie**: Modyfikacja istniejących treści
- **Usuwanie**: Bezpieczne usuwanie z systemu

#### Zarządzanie użytkownikami
- **Lista użytkowników**: Przegląd wszystkich kont
- **Role**: Przydzielanie uprawnień
- **Statystyki**: Aktywność, preferencje, postępy

#### Statystyki systemu
- **Użytkownicy**: Liczba aktywnych, nowych, retencja
- **Odcinki**: Popularność, współczynnik ukończenia, oceny
- **Serii**: Oceny, szczegóły, aktywność
- **Techniczne**: Języki, prędkości, aktywność godzinowa

## ⭐ System oceniania

### Funkcjonalności:

#### Ocenianie w odtwarzaczu
- **Lokalizacja**: 5 pustych gwiazdek w prawym górnym rogu playeru
- **Interakcja**: Kliknięcie w gwiazdkę ustawia ocenę
- **Wyświetlanie**: Pokazuje aktualną ocenę użytkownika
- **Aktualizacja**: Natychmiastowe odświeżenie po ocenieniu

#### Średnie oceny na liście odcinków
- **Lokalizacja**: 5 złotych gwiazdek przy każdym odcinku
- **Precyzja**: Obsługa całych i pół gwiazdek
- **Sortowanie**: Możliwość sortowania od najwyżej ocenianych

#### Statystyki użytkownika
- **Tab "Oceny"**: Dedykowana sekcja w statystykach
- **Lista ocenionych**: Najwyżej oceniane odcinki użytkownika
- **Automatyczne odświeżanie**: Po dodaniu nowej oceny

#### Techniczne szczegóły:
- **Baza danych**: Tabela `ratings` z indeksami dla wydajności
- **API**: UPSERT (INSERT OR REPLACE) dla szybkiego zapisu
- **Frontend**: Globalne eventy dla synchronizacji komponentów
- **Wydajność**: Zoptymalizowane zapytania SQL

## 🏆 System osiągnięć

### Typy osiągnięć:

#### 1. Szybkość odtwarzania
- **Nazwa**: "Szybki słuchacz"
- **Opis**: Słuchaj przez 1 godzinę z prędkością 2x
- **Kryteria**: 3600 sekund z speed >= 2.0

#### 2. Precyzyjne słuchanie
- **Nazwa**: "Perfekcjonista"
- **Opis**: Ukończ 5 odcinków z 95%+ dokładnością
- **Kryteria**: 5 odcinków z completion >= 95%

#### 3. Wzorce czasowe
- **Nazwa**: "Nocny mark" / "Ranny ptaszek"
- **Opis**: Słuchaj między 22:00-06:00 / 06:00-10:00
- **Kryteria**: 10 sesji w określonych godzinach

#### 4. Seria
- **Nazwa**: "Konsekwentny"
- **Opis**: Słuchaj przez 7 dni z rzędu
- **Kryteria**: 7 kolejnych dni z aktywnością

#### 5. Dzienna aktywność
- **Nazwa**: "Żarłok wiedzy"
- **Opis**: Słuchaj 5 odcinków w jednym dniu
- **Kryteria**: 5 odcinków w ciągu 24h

### Mechanika:
- **Automatyczne sprawdzanie**: Przy każdym zapisie postępu
- **Jednorazowe przyznawanie**: Każde osiągnięcie tylko raz
- **Powiadomienia**: Informacje o nowych osiągnięciach
- **Progres**: Śledzenie postępów do osiągnięć

## 👨‍💼 Panel administratora

### Dostęp:
- **Rola**: admin lub super_admin
- **Ścieżka**: /admin-panel
- **Autoryzacja**: JWT token

### Funkcjonalności:

#### Dashboard
- **Przegląd systemu**: Liczby użytkowników, odcinków, serii
- **Wykresy aktywności**: Aktywność w czasie
- **Ostatnie działania**: Logi aktywności

#### Zarządzanie seriami
- **Lista serii**: Tabela z filtrowaniem i sortowaniem
- **Dodawanie**: Formularz z uploadem obrazu
- **Edycja**: Modyfikacja istniejących serii
- **Usuwanie**: Bezpieczne usuwanie z potwierdzeniem

#### Zarządzanie odcinkami
- **Lista odcinków**: Tabela z filtrami
- **Dodawanie**: Upload MP3 + metadane
- **Edycja**: Modyfikacja treści i linków
- **Usuwanie**: Usuwanie z systemu

#### Zarządzanie użytkownikami
- **Lista użytkowników**: Tabela z danymi
- **Dodawanie**: Tworzenie nowych kont
- **Edycja**: Modyfikacja ról i uprawnień
- **Usuwanie**: Dezaktywacja kont

#### Statystyki
- **Użytkownicy**: Aktywność, retencja, top aktywni
- **Odcinki**: Popularność, współczynnik ukończenia, oceny
- **Serii**: Oceny, szczegóły, aktywność
- **Techniczne**: Języki, prędkości, aktywność godzinowa

## 🔒 Bezpieczeństwo

### Autoryzacja i uwierzytelnianie:
- **JWT Tokens**: Bezpieczne tokeny z czasem wygaśnięcia
- **Bcrypt**: Haszowanie haseł
- **Role**: Hierarchia uprawnień (user/admin/super_admin)

### Ochrona endpointów:
- **Rate limiting**: Ograniczenie liczby requestów (500/15min)
- **Helmet**: Nagłówki bezpieczeństwa
- **CORS**: Konfiguracja cross-origin
- **Input validation**: Walidacja danych wejściowych

### Upload plików:
- **Typy plików**: Tylko MP3
- **Rozmiar**: Maksymalnie 200MB
- **Sanityzacja**: Bezpieczne nazwy plików
- **Katalogi**: Izolowane katalogi per seria

### Baza danych:
- **Prepared statements**: Ochrona przed SQL injection
- **Walidation**: Sprawdzanie typów danych
- **Backup**: Regularne kopie zapasowe
- **Indeksy**: Zoptymalizowane zapytania dla ocen

## 🧪 Testowanie

### Testy automatyczne
Aplikacja zawiera kompleksowy system testów automatycznych:

#### Testy backendu (Jest + Supertest)
- **Testy integracyjne**: Sprawdzanie endpointów API
- **Testy autoryzacji**: Logowanie, rejestracja, walidacja tokenów
- **Testy funkcjonalności**: Epizody, statystyki, osiągnięcia
- **Testy bezpieczeństwa**: Walidacja danych, obsługa błędów

#### Testy frontendu (Playwright E2E)
- **Testy end-to-end**: Główne ścieżki użytkownika
- **Testy autoryzacji**: Logowanie, rejestracja, wylogowanie
- **Testy funkcjonalności**: Odtwarzanie, ocenianie, ulubione
- **Testy statystyk**: Zakładki, osiągnięcia, historia
- **Testy panelu admin**: Zarządzanie użytkownikami, seriami, odcinkami
- **Testy responsywności**: Mobile, tablet, desktop
- **Testy dostępności**: ARIA, klawiatura, screen reader

#### Pokrycie kodu
- Automatyczne generowanie raportów pokrycia
- Identyfikacja nieprzetestowanych ścieżek kodu
- Monitorowanie jakości kodu

#### Uruchamianie testów
```bash
# Wszystkie testy
npm test

# Tylko backend
npm run test:backend

# Testy integracyjne (podstawowe) - 21 testów
npm run test:simple

# Testy z pokryciem kodu
npm run test:coverage

# Testy w trybie watch
npm run test:watch

# Testy E2E frontendu (58 testów)
npm run test:e2e

# Testy E2E z interfejsem graficznym
npm run test:e2e:ui

# Testy E2E w trybie debug
npm run test:e2e:debug

# Testy E2E z raportem HTML
npm run test:e2e:report

# Uruchomienie środowiska testowego
npm run start:test
```

#### Statystyki testów E2E
- **Łącznie**: 58 testów
- **Czas wykonania**: ~2.6 minuty
- **Pokrycie**: Autoryzacja, odcinki, statystyki, panel admin, dostępność
- **Przeglądarki**: Chromium (można dodać Firefox, Safari)

### Testy manualne
Zobacz plik `CHECKLIST.md` z szczegółową listą testów.

### Testy API:
```bash
# Test logowania
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@food4thought.local","password":"admin123"}'

# Test statystyk admina
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/admin-stats/stats

# Test oceniania
curl -X POST http://localhost:3001/api/episodes/1/rating \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'
```

## 🔧 Rozwiązywanie problemów

### Częste problemy:

#### 1. Backend się nie uruchamia
```bash
# Sprawdź porty
lsof -i :3001

# Sprawdź zależności
npm install

# Sprawdź logi
node src/server/index.js
```

#### 2. Frontend się nie łączy z backendem
```bash
# Sprawdź proxy w vite.config.js
# Sprawdź CORS w backendzie
# Sprawdź porty
```

#### 3. Błędy bazy danych
```bash
# Sprawdź uprawnienia do pliku DB
# Sprawdź ścieżkę do bazy danych
# Sprawdź logi SQL
```

#### 4. Problemy z uploadem plików
```bash
# Sprawdź uprawnienia katalogów
# Sprawdź rozmiar pliku
# Sprawdź typ MIME
```

#### 5. Problemy z ocenianiem ⭐ **NOWE**
```bash
# Sprawdź token JWT (może wygasł)
# Sprawdź endpoint /api/episodes/:id/rating
# Sprawdź logi w konsoli przeglądarki
```

### Debugowanie:
- **Logi backendu**: Konsola terminala
- **Logi frontendu**: Browser DevTools
- **Network**: Sprawdź requesty w DevTools
- **Database**: Bezpośrednie zapytania SQL

### Ostatnie naprawy (2025-01-05):
- ✅ **Routing**: Naprawiono konflikt `/series-stats` vs `/:id`
- ✅ **useEffect**: Rozwiązano problem z `fetchStats` przez `useRef`
- ✅ **Rate limiting**: Zwiększono do 500 requestów/15min
- ✅ **Ocenianie**: Zoptymalizowano zapytania SQL i dodano indeksy
- ✅ **Synchronizacja**: Globalne eventy dla aktualizacji komponentów
- ✅ **Wydajność**: UPSERT dla szybkiego zapisu ocen
- ✅ **Testy automatyczne**: Dodano kompleksowy system testów integracyjnych (21 testów)
- ✅ **Walidacja**: Naprawiono walidację `confirmPassword` w rejestracji
- ✅ **Testy E2E**: Dodano kompletny system testów end-to-end z Playwright
- ✅ **Responsywność**: Testy dla mobile, tablet, desktop
- ✅ **Dostępność**: Testy ARIA, klawiatury, screen reader

## 🚀 Plan rozwoju

### Krótkoterminowe (1-2 miesiące):
- [ ] Testy E2E z Cypress/Playwright
- [ ] System powiadomień
- [ ] Eksport danych użytkownika
- [ ] Backup automatyczny
- [ ] Monitoring wydajności

### Średnioterminowe (3-6 miesięcy):
- [ ] Aplikacja mobilna (React Native)
- [ ] System komentarzy
- [ ] Rekomendacje AI
- [ ] Integracja z zewnętrznymi API
- [ ] System płatności

### Długoterminowe (6+ miesięcy):
- [ ] Mikrousługi
- [ ] Chmura (AWS/Azure)
- [ ] Machine Learning
- [ ] Social features
- [ ] Marketplace treści

## 📄 Licencja

Projekt jest objęty licencją ISC.

## 🤝 Wsparcie

### Dokumentacja:
- [CHECKLIST.md](./CHECKLIST.md) - Lista testów manualnych
- [TESTING.md](./TESTING.md) - Instrukcje testowania

### Kontakt:
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Wiki**: GitHub Wiki

---

**Ostatnia aktualizacja**: 2025-01-05
**Wersja**: 1.3.0
**Status**: Produkcyjna z systemem oceniania 