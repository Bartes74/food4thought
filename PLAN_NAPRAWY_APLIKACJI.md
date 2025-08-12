# PLAN NAPRAWY APLIKACJI FOOD4THOUGHT

## FAZA 1: Uporządkowanie bazy danych (Priorytet 1 - Najwyższy)

### 1.1 Konsolidacja bazy danych
- [x] Sprawdzenie zawartości plików bazy danych
- [ ] Usunięcie plików tymczasowych SQLite (`food4thought.db-shm`, `food4thought.db-wal`)
- [ ] Zachowanie `food4thought.db` jako głównej bazy
- [ ] Usunięcie `food4thought.db.backup` po weryfikacji
- [ ] Aktualizacja .gitignore dla plików tymczasowych SQLite

## FAZA 2: Naprawa błędów krytycznych (Priorytet 2 - Wysoki)

### 2.1 Naprawa konfliktu portów
- [ ] Sprawdzenie konfiguracji Vite
- [ ] Upewnienie się, że backend zawsze na 3001, frontend na 3000
- [ ] Naprawa konfiguracji proxy w Vite

### 2.2 Naprawa błędów połączenia API
- [ ] Sprawdzenie konfiguracji proxy w Vite
- [ ] Upewnienie się, że serwer jest uruchomiony przed testami
- [ ] Naprawa błędów `ECONNREFUSED`

## FAZA 3: Naprawa testów e2e (Priorytet 3 - Średni)

### 3.1 Aktualizacja selektorów w testach
- [ ] Sprawdzenie aktualnej struktury UI
- [ ] Aktualizacja selektorów dla zakładek "Serie" i "Odcinki"
- [ ] Dostosowanie ścieżek nawigacji w panelu administratora

### 3.2 Naprawa konfiguracji Playwright
- [ ] Sprawdzenie czy global setup działa poprawnie
- [ ] Upewnienie się, że testy czekają na uruchomienie serwera
- [ ] Naprawa konfiguracji testów e2e

## FAZA 4: Optymalizacja i czyszczenie (Priorytet 4 - Niski)

### 4.1 Czyszczenie niepotrzebnych plików
- [ ] Usunięcie niepotrzebnych plików bazy danych
- [ ] Usunięcie plików tymczasowych SQLite z git
- [ ] Dodanie odpowiednich wpisów do .gitignore

### 4.2 Finalne testy
- [ ] Uruchomienie wszystkich testów ponownie
- [ ] Sprawdzenie czy aplikacja działa poprawnie
- [ ] Weryfikacja wszystkich funkcjonalności

---

## Status realizacji:
- **FAZA 1**: ✅ Ukończona
  - [x] Sprawdzenie zawartości plików bazy danych
  - [x] Usunięcie plików tymczasowych SQLite (`food4thought.db-shm`, `food4thought.db-wal`)
  - [x] Zachowanie `food4thought.db` jako głównej bazy
  - [x] Usunięcie `food4thought.db.backup` po weryfikacji
  - [x] Aktualizacja .gitignore dla plików tymczasowych SQLite

- **FAZA 2**: ✅ Ukończona
  - [x] Sprawdzenie konfiguracji Vite
  - [x] Upewnienie się, że backend zawsze na 3001, frontend na 3000
  - [x] Naprawa konfiguracji proxy w Vite

- **FAZA 3**: 🔄 W trakcie realizacji
  - [x] Sprawdzenie aktualnej struktury UI
  - [x] Aktualizacja selektorów dla zakładek "Serie" i "Odcinki" w testach admin
  - [ ] Dostosowanie ścieżek nawigacji w panelu administratora
  - [ ] Naprawa konfiguracji testów e2e

- **FAZA 4**: Oczekuje

## Uwagi:
- Aplikacja została wypchnięta na GitHub przed rozpoczęciem napraw
- Błąd `requireAdmin` został już naprawiony
- Testy backend działają poprawnie (142/142 testów przechodzi)
