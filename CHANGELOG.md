# Changelog - Food 4 Thought

Wszystkie istotne zmiany w projekcie Food 4 Thought będą dokumentowane w tym pliku.

## [2.2.1] - 2025-01-12

### 🔧 Naprawione
- **Statystyki administratora** - naprawiony endpoint `/api/admin/stats` zwracający błąd "Nie znaleziono strony"
- **Routing API** - dodano routing dla `/api/admin` żeby był kompatybilny z frontendem
- **Struktura danych** - endpoint zwraca pełne statystyki z sekcjami users, episodes, series, technical
- **Kompatybilność** - frontend może teraz poprawnie wyświetlać statystyki administratora

### 📊 Statystyki administratora
- **Sekcja users** - total, active, new, retention
- **Sekcja episodes** - total, averageRating, completionRate, averageCompletionTime
- **Sekcja series** - total, active, averageCompletion
- **Sekcja technical** - languages, playbackSpeeds, hourlyActivity
- **Filtry czasowe** - today, week, month, all

## [2.2.0] - 2025-01-12

### 🎉 Dodane
- **System weryfikacji email** - potwierdzanie adresów email przy rejestracji
- **UI-based email verification** - wyświetlanie linków weryfikacyjnych w interfejsie
- **Skrypty testowe** - automatyczne testowanie rejestracji i zarządzania użytkownikami
- **Automatyczne czyszczenie** - skrypty automatycznie usuwają dane testowe
- **System ról użytkowników** - user, admin, super_admin z odpowiednimi uprawnieniami

### 🔧 Naprawione
- **Nodemailer integration** - naprawiony błąd `createTransporter is not a function`
- **Email fallback system** - aplikacja używa mock email gdy SMTP nie jest skonfigurowany
- **Testowe użytkowniki** - wyczyszczone wszystkie testowe dane z bazy
- **Struktura bazy danych** - poprawione kolumny w tabeli `user_stats`

### 🧪 Testy
- **Nowe skrypty testowe**:
  - `npm run test:register` - interaktywny test rejestracji
  - `npm run test:register:batch` - test rejestracji wielu użytkowników
  - `npm run test:users` - test zarządzania użytkownikami z automatycznym czyszczeniem
  - `npm run check:tokens` - sprawdzanie aktywnych tokenów weryfikacyjnych

### 📚 Dokumentacja
- **Zaktualizowany README.md** - kompletna dokumentacja funkcjonalności
- **Dodana sekcja "Znane problemy"** - dokumentacja znanych ograniczeń
- **Instrukcje konfiguracji** - szczegółowe kroki instalacji i uruchomienia

### ⚠️ Znane problemy
- **Usuwanie użytkowników przez API** - nie działa dla użytkowników z danymi (błąd FOREIGN KEY)
  - **Rozwiązanie**: Skrypty testowe automatycznie czyszczą dane przez SQL
- **Email verification** - używa fallback (mock) zamiast rzeczywistego SMTP
  - **Rozwiązanie**: Ustaw zmienne środowiskowe EMAIL_USER i EMAIL_PASS

## [2.1.0] - 2025-01-11

### 🔧 Naprawione
- **Uproszczenie logiki statusów** - użycie tylko tabeli `user_progress`
- **Automatyczne ładowanie ostatniego odcinka** - po zalogowaniu
- **System ulubionych** - z wyszukiwaniem i grupowaniem
- **Cascade Delete** - zachowanie integralności bazy danych

### 📊 Baza danych
- **Naprawa duplikatów osiągnięć** - z 1928 do 19 unikalnych
- **Nowa struktura user_progress** - uproszczone pola i logika
- **Informacje o serii** - dodane do wszystkich endpointów odcinków

## [2.0.0] - 2025-01-10

### 🎉 Dodane
- **System osiągnięć** - 19 unikalnych odznak
- **Panel administratora** - zarządzanie użytkownikami i statystykami
- **Responsywny design** - obsługa wszystkich urządzeń
- **Ciemny/jasny motyw** - wybór preferowanego wyglądu
- **Wielojęzyczność** - polski i angielski

### 🧪 Testy
- **Backend**: 152/152 testów przechodzi (100%)
- **E2E**: Wszystkie testy Playwright przechodzi
- **Pokrycie**: Kompletne pokrycie funkcjonalności

## [1.0.0] - 2025-01-09

### 🎉 Pierwsza wersja
- **Zarządzanie seriami** - dodawanie, edycja i usuwanie serii podcastów
- **Zarządzanie odcinkami** - upload i edycja odcinków z metadanymi
- **System ulubionych** - dodawanie odcinków do ulubionych
- **Statystyki użytkownika** - śledzenie postępów i historii słuchania
- **Autentykacja JWT** - bezpieczne logowanie i rejestracja

---

## Format

Ten plik używa [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
i projekt jest zgodny z [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### Typy zmian:
- `🎉 Dodane` - nowe funkcjonalności
- `🔧 Naprawione` - poprawki błędów
- `🧪 Testy` - zmiany w testach
- `📚 Dokumentacja` - aktualizacje dokumentacji
- `⚠️ Znane problemy` - dokumentacja znanych ograniczeń
- `📊 Baza danych` - zmiany w strukturze bazy danych
