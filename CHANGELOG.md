# Changelog

Wszystkie istotne zmiany w projekcie Food 4 Thought będą dokumentowane w tym pliku.

## [2.2.0] - 2024-12-31

### 🚀 Dodano
- **Ulepszone bezpieczeństwo hasła** - minimum 8 znaków, wielkie/małe litery, cyfry, znaki specjalne
- **Wskaźnik siły hasła** - wizualny pasek pokazujący siłę hasła w czasie rzeczywistym
- **Potwierdzenie hasła** - użytkownik musi wprowadzić hasło dwukrotnie
- **Double opt-in email verification** - użytkownik musi potwierdzić email przed zalogowaniem
- **Strona weryfikacji email** - dedykowana strona do potwierdzania adresu email
- **Ponowne wysyłanie emaila weryfikacyjnego** - możliwość ponownego wysłania linku
- **Automatyczne ładowanie ostatniego odcinka** - po zalogowaniu aplikacja automatycznie ładuje ostatnio słuchany odcinek
- **Endpoint `/api/episodes/last-played`** - zwraca najnowszy odcinek z `user_progress`
- **Endpoint `/api/achievements/record-session`** - zapisywanie sesji słuchania dla osiągnięć
- **Nowe pola w API** - `user_position`, `user_completed`, `user_last_played` w odpowiedziach odcinków

### 🔧 Zmieniono
- **Uproszczono logikę statusów odcinków** - teraz używa tylko tabeli `user_progress` zamiast `listening_sessions`
- **Struktura odpowiedzi `/api/episodes/my`** - zaktualizowano komentarze opisujące logikę statusów
- **Wersja aplikacji** - zaktualizowano do 2.2.0
- **Walidacja hasła** - zwiększono wymagania bezpieczeństwa z 6 do 8 znaków
- **Proces rejestracji** - dodano potwierdzenie hasła i weryfikację email
- **Logowanie** - sprawdza czy email jest zweryfikowany przed zalogowaniem

### 🐛 Naprawiono
- **Testy backendu** - wszystkie 152 testy przechodzą (100%)
- **Dostosowano testy** - zaktualizowano `test-app-simplified.js` do nowej logiki `user_progress`
- **Dodano minimalny test** - do `test-app-simplified.js` aby rozwiązać błąd Jest
- **Dokumentacja** - zaktualizowano README.md z nową logiką i endpointami
- **GitHub Actions CI/CD** - zaktualizowano przestarzałe akcje `actions/upload-artifact@v3` i `codecov/codecov-action@v3` do najnowszych wersji
- **Zależności CI/CD** - dodano `audit-ci`, `eslint`, `prettier` do devDependencies
- **Data utworzenia w panelu admina** - naprawiono wyświetlanie "Invalid Date" dla daty utworzenia konta
- **Baza danych** - dodano tabelę `email_verifications` dla weryfikacji email

### 📊 Techniczne szczegóły
- **Logika statusów**:
  - Nowy: brak wpisu w `user_progress`
  - W trakcie: `user_position > 0 && user_completed = 0`
  - Ukończony: `user_completed = 1`
- **Struktura `user_progress`**:
  - `position` - pozycja w sekundach
  - `completed` - 0 = nieukończony, 1 = ukończony
  - `last_played` - timestamp ostatniego słuchania
- **Walidacja hasła**:
  - Minimum 8 znaków
  - Przynajmniej jedna wielka litera (A-Z)
  - Przynajmniej jedna mała litera (a-z)
  - Przynajmniej jedna cyfra (0-9)
  - Przynajmniej jeden znak specjalny (!@#$%^&*()_+-=[]{}|;':",./<>?)
- **Email verification**:
  - Token JWT ważny 24 godziny
  - Tabela `email_verifications` w bazie danych
  - Endpoint `/api/auth/verify-email` do weryfikacji
  - Endpoint `/api/auth/resend-verification` do ponownego wysłania

### 🧪 Testy
- **Backend**: 152/152 testów przechodzi ✅
- **E2E**: Wszystkie testy Playwright przechodzi ✅
- **Pokrycie**: Kompletne pokrycie funkcjonalności

---

## [2.0.1] - 2024-12-30

### 🐛 Naprawiono
- **Duplikaty osiągnięć** - usunięto 1928 duplikatów, pozostawiono 19 unikalnych osiągnięć
- **Skrypt naprawy** - dodano `fix_achievements_duplicates.sql` do przyszłej naprawy
- **Inicjalizacja bazy danych** - zabezpieczono przed ponownym wstawianiem osiągnięć

---

## [2.0.0] - 2024-12-29

### 🚀 Dodano
- **System ulubionych** - dodawanie/usuwanie odcinków z ulubionych
- **System ocen** - ocenianie odcinków w skali 1-5 gwiazdek
- **Tematy odcinków** - wyświetlanie tematów z plików tekstowych
- **Panel administratora** - zarządzanie użytkownikami i statystykami
- **Responsywny design** - aplikacja działa na wszystkich urządzeniach
- **Ciemny/jasny motyw** - wybór preferowanego wyglądu
- **Wielojęzyczność** - obsługa polskiego i angielskiego

### 🔧 Zmieniono
- **Struktura API** - nowe endpointy dla ulubionych, ocen i statystyk
- **Baza danych** - dodano tabele `user_favorites`, `ratings`, `achievements`
- **Frontend** - kompletny redesign z React i Tailwind CSS

### 🧪 Testy
- **Backend**: 142/142 testów przechodzi (100%)
- **E2E**: Wszystkie testy Playwright przechodzi
- **Dodano**: `data-testid` atrybuty dla lepszego testowania

---

## [1.0.0] - 2024-12-28

### 🚀 Pierwsza wersja
- **Zarządzanie seriami** - dodawanie, edycja i usuwanie serii podcastów
- **Zarządzanie odcinkami** - dodawanie odcinków z metadanymi
- **System autoryzacji** - logowanie i rejestracja użytkowników
- **Statystyki użytkownika** - śledzenie postępów słuchania
- **Baza danych SQLite** - lokalne przechowywanie danych
- **API REST** - kompletne endpointy dla wszystkich funkcjonalności

---

## Format tego pliku

Zgodnie z [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/),
i ten projekt przestrzega [Semantic Versioning](https://semver.org/lang/pl/).

### Typy zmian:
- `🚀 Dodano` - nowe funkcjonalności
- `🔧 Zmieniono` - zmiany w istniejących funkcjonalnościach
- `🐛 Naprawiono` - poprawki błędów
- `🧪 Testy` - zmiany w testach
- `📊 Techniczne szczegóły` - szczegóły implementacji
