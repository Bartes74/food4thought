# Changelog

Wszystkie istotne zmiany w projekcie Food 4 Thought będą dokumentowane w tym pliku.

## [2.1.0] - 2024-12-31

### 🚀 Dodano
- **Automatyczne ładowanie ostatniego odcinka** - po zalogowaniu aplikacja automatycznie ładuje ostatnio słuchany odcinek
- **Endpoint `/api/episodes/last-played`** - zwraca najnowszy odcinek z `user_progress`
- **Endpoint `/api/achievements/record-session`** - zapisywanie sesji słuchania dla osiągnięć
- **Nowe pola w API** - `user_position`, `user_completed`, `user_last_played` w odpowiedziach odcinków

### 🔧 Zmieniono
- **Uproszczono logikę statusów odcinków** - teraz używa tylko tabeli `user_progress` zamiast `listening_sessions`
- **Struktura odpowiedzi `/api/episodes/my`** - zaktualizowano komentarze opisujące logikę statusów
- **Wersja aplikacji** - zaktualizowano do 2.1.0

### 🐛 Naprawiono
- **Testy backendu** - wszystkie 152 testy przechodzą (100%)
- **Dostosowano testy** - zaktualizowano `test-app-simplified.js` do nowej logiki `user_progress`
- **Dodano minimalny test** - do `test-app-simplified.js` aby rozwiązać błąd Jest
- **Dokumentacja** - zaktualizowano README.md z nową logiką i endpointami

### 📊 Techniczne szczegóły
- **Logika statusów**:
  - Nowy: brak wpisu w `user_progress`
  - W trakcie: `user_position > 0 && user_completed = 0`
  - Ukończony: `user_completed = 1`
- **Struktura `user_progress`**:
  - `position` - pozycja w sekundach
  - `completed` - 0 = nieukończony, 1 = ukończony
  - `last_played` - timestamp ostatniego słuchania

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
