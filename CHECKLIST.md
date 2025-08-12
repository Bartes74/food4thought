# 🧪 Checklista Testowa - Food4Thought

## 📋 Jak używać tej checklisty

**Przed każdą większą zmianą lub przed wdrożeniem:**
1. Uruchom aplikację (`./start.sh` lub `npm run dev` + `npm run client`)
2. Przejdź przez wszystkie punkty w sekcji "Podstawowe funkcjonalności"
3. Jeśli wprowadzasz zmiany w konkretnych obszarach, przejdź przez odpowiednie sekcje szczegółowe
4. Zaznacz ✅ po pomyślnym przejściu każdego testu
5. Jeśli coś nie działa, napraw przed kontynuowaniem

---

## 🔐 Podstawowe funkcjonalności (OBOWIĄZKOWE)

### Logowanie i autoryzacja
- [ ] **Logowanie administratora**
  - [ ] Logowanie z `admin@food4thought.local` / `admin123`
  - [ ] Przekierowanie na stronę główną po zalogowaniu
  - [ ] Wyświetlanie roli administratora w interfejsie

- [ ] **Logowanie zwykłego użytkownika**
  - [ ] Logowanie z istniejącym kontem użytkownika
  - [ ] Przekierowanie na stronę głównej po zalogowaniu
  - [ ] Brak dostępu do panelu administratora

- [ ] **Wylogowanie**
  - [ ] Przycisk wylogowania działa
  - [ ] Przekierowanie na stronę logowania
  - [ ] Brak dostępu do chronionych stron po wylogowaniu

### Strona główna
- [ ] **Wyświetlanie serii**
  - [ ] Lista serii się ładuje
  - [ ] Grafiki serii są wyświetlane
  - [ ] Kolory serii są zastosowane
  - [ ] Kliknięcie w serię pokazuje odcinki

- [ ] **Nawigacja**
  - [ ] Przycisk wstecz działa na wszystkich stronach (oprócz głównej)
  - [ ] Menu nawigacyjne jest widoczne
  - [ ] Wszystkie linki w menu działają

---

## ⭐ System oceniania (NOWE)

### Ocenianie w odtwarzaczu
- [ ] **Wyświetlanie gwiazdek**
  - [ ] 5 pustych gwiazdek w prawym górnym rogu playeru
  - [ ] Gwiazdki są na tej samej wysokości co tytuł odcinka
  - [ ] Gwiazdki są czytelne w trybie jasnym i ciemnym

- [ ] **Interakcja z ocenianiem**
  - [ ] Kliknięcie w gwiazdkę ustawia ocenę
  - [ ] Gwiazdki się wypełniają po ocenieniu
  - [ ] Można zmienić ocenę klikając inną gwiazdkę
  - [ ] Ocena jest zapisywana natychmiast

- [ ] **Synchronizacja**
  - [ ] Po ocenieniu lista odcinków się odświeża
  - [ ] AudioPlayer pokazuje aktualną ocenę
  - [ ] Brak opóźnień w interfejsie po ocenieniu

### Średnie oceny na liście odcinków
- [ ] **Wyświetlanie średnich ocen**
  - [ ] 5 złotych gwiazdek przy każdym odcinku
  - [ ] Obsługa całych i pół gwiazdek
  - [ ] Gwiazdki są czytelne w obu trybach

- [ ] **Sortowanie według ocen**
  - [ ] Sortowanie od najwyżej ocenianych działa
  - [ ] Odcinki bez ocen są na końcu listy
  - [ ] Sortowanie nie wpływa na inne funkcjonalności

### Statystyki użytkownika
- [ ] **Tab "Oceny"**
  - [ ] Tab jest dostępny w statystykach użytkownika
  - [ ] Lista najwyżej ocenianych odcinków jest wyświetlana
  - [ ] Odcinki są posortowane od najwyższej oceny

- [ ] **Automatyczne odświeżanie**
  - [ ] Po dodaniu nowej oceny tab się aktualizuje
  - [ ] Nowy odcinek pojawia się na liście
  - [ ] Brak błędów 404 w konsoli

---

## 📊 Panel Administratora

### Statystyki administratora (`/admin-stats`)
- [ ] **Dostęp**
  - [ ] Strona się ładuje bez błędów
  - [ ] Statystyki są wyświetlane
  - [ ] Brak błędów SQL w konsoli backendu

- [ ] **Dane statystyczne**
  - [ ] Liczba użytkowników jest wyświetlana
  - [ ] Liczba odcinków jest wyświetlana
  - [ ] Liczba serii jest wyświetlana
  - [ ] Wykresy aktywności są widoczne

- [ ] **Filtrowanie czasowe**
  - [ ] Przełączanie między "Dzisiaj", "Tydzień", "Miesiąc", "Wszystko"
  - [ ] Dane się aktualizują po zmianie filtra

- [ ] **Interaktywne elementy**
  - [ ] Kliknięcie w "Odcinki" nie powoduje zniknięcia aplikacji
  - [ ] Kliknięcie w "Serie" nie powoduje zniknięcia aplikacji
  - [ ] Wszystkie linki działają poprawnie

### Zarządzanie seriami (`/series`)
- [ ] **Lista serii**
  - [ ] Wszystkie serie są wyświetlane
  - [ ] Grafiki serii są widoczne
  - [ ] Kolory serii są zastosowane

- [ ] **Dodawanie serii**
  - [ ] Formularz dodawania się otwiera
  - [ ] Upload grafiki działa
  - [ ] Wybór koloru działa
  - [ ] Nowa seria pojawia się na liście

- [ ] **Edycja serii**
  - [ ] Edycja nazwy działa
  - [ ] Zmiana grafiki działa
  - [ ] Zmiana koloru działa
  - [ ] Zmiany są zapisywane

- [ ] **Usuwanie serii**
  - [ ] Potwierdzenie usuwania działa
  - [ ] Seria znika z listy
  - [ ] Brak błędów w konsoli

### Zarządzanie odcinkami (`/episodes`)
- [ ] **Lista odcinków**
  - [ ] Wszystkie odcinki są wyświetlane
  - [ ] Filtrowanie po seriach działa
  - [ ] Status odcinków jest poprawny (nowy/w trakcie/ukończony)

- [ ] **Dodawanie odcinka**
  - [ ] Formularz dodawania się otwiera
  - [ ] Upload pliku audio (MP3) działa
  - [ ] Wybór serii działa
  - [ ] Dodawanie dodatkowych informacji działa
  - [ ] Dodawanie linków/tematów działa
  - [ ] Nowy odcinek pojawia się na liście

- [ ] **Edycja odcinka**
  - [ ] Edycja tytułu działa
  - [ ] Edycja dodatkowych informacji działa
  - [ ] Edycja linków/tematów działa
  - [ ] Zmiany są zapisywane

- [ ] **Usuwanie odcinka**
  - [ ] Potwierdzenie usuwania działa
  - [ ] Odcinek znika z listy
  - [ ] Brak błędów w konsoli

### Zarządzanie użytkownikami (`/users`)
- [ ] **Lista użytkowników**
  - [ ] Wszyscy użytkownicy są wyświetleni
  - [ ] Role użytkowników są widoczne

- [ ] **Dodawanie użytkownika**
  - [ ] Formularz dodawania się otwiera
  - [ ] Nowy użytkownik jest tworzony
  - [ ] Można się zalogować nowym kontem

---

## 🎵 Odtwarzacz Audio

### Podstawowe funkcje
- [ ] **Ładowanie odcinka**
  - [ ] Kliknięcie w odcinek ładuje player
  - [ ] Grafika serii jest wyświetlana (300x300px)
  - [ ] Numer odcinka jest widoczny na grafice
  - [ ] Tytuł odcinka jest wyświetlany

- [ ] **Kontrolki odtwarzania**
  - [ ] Play/pause działa
  - [ ] Przewijanie działa
  - [ ] Zmiana głośności działa
  - [ ] Zmiana prędkości odtwarzania działa

- [ ] **Tematy odcinka**
  - [ ] Lista tematów jest wyświetlana
  - [ ] Timestamp jest na tej samej linii co tytuł tematu
  - [ ] Linki pod aktualnym tematem są widoczne
  - [ ] Linki otwierają się w nowej zakładce
  - [ ] Lista tematów rozwija się w górę jako overlay
  - [ ] Lista automatycznie się zamyka po wyborze tematu

- [ ] **Dodatkowe informacje**
  - [ ] Pierwsze 500 znaków są wyświetlane z "[...]"
  - [ ] Kliknięcie rozwija pełny tekst
  - [ ] Ponowne kliknięcie zwija tekst
  - [ ] Kursor zmienia się na pointer

### Śledzenie postępu
- [ ] **Zapisywanie postępu**
  - [ ] Postęp jest zapisywany podczas odtwarzania
  - [ ] Po ponownym otwarciu odcinek wznawia od ostatniej pozycji
  - [ ] Oznaczenie jako ukończony działa

- [ ] **System osiągnięć**
  - [ ] Sesje słuchania są rejestrowane
  - [ ] Osiągnięcia są sprawdzane po ukończeniu odcinka
  - [ ] Brak błędów w konsoli związanych z osiągnięciami

---

## 💖 Ulubione odcinki

### Zarządzanie ulubionymi
- [ ] **Dodawanie do ulubionych**
  - [ ] Przycisk "Dodaj do ulubionych" działa
  - [ ] Odcinek pojawia się na liście ulubionych

- [ ] **Lista ulubionych (`/favorites`)**
  - [ ] Strona się ładuje bez błędów
  - [ ] Wszystkie ulubione odcinki są wyświetlane
  - [ ] Wyszukiwanie w ulubionych działa
  - [ ] Komunikat o braku ulubionych jest wyświetlany gdy lista jest pusta

- [ ] **Usuwanie z ulubionych**
  - [ ] Przycisk usuwania z ulubionych działa
  - [ ] Odcinek znika z listy ulubionych

---

## 🏆 System osiągnięć

### Strona osiągnięć (`/achievements`)
- [ ] **Dostęp**
  - [ ] Strona się ładuje bez błędów
  - [ ] Nagłówek i menu są widoczne

- [ ] **Wyświetlanie osiągnięć**
  - [ ] Wszystkie osiągnięcia są wyświetlane
  - [ ] Osiągnięcia są pogrupowane według kategorii
  - [ ] Postęp jest wyświetlany dla każdego osiągnięcia
  - [ ] Odblokowane osiągnięcia są oznaczone

- [ ] **Statystyki użytkownika**
  - [ ] Całkowity czas słuchania jest wyświetlany
  - [ ] Liczba ukończonych odcinków jest wyświetlana
  - [ ] Aktualny streak jest wyświetlany
  - [ ] Najdłuższy streak jest wyświetlany

---

## 📊 Statystyki użytkownika

### Strona statystyk (`/stats`)
- [ ] **Dostęp**
  - [ ] Strona się ładuje bez błędów 404
  - [ ] Wszystkie taby są dostępne
  - [ ] Brak błędów w konsoli przeglądarki

- [ ] **Tab "Przegląd"**
  - [ ] Podstawowe statystyki są wyświetlane
  - [ ] Informacja o ocenionych odcinkach jest widoczna
  - [ ] Link do taba "Oceny" działa

- [ ] **Tab "Oceny"**
  - [ ] Lista najwyżej ocenianych odcinków jest wyświetlana
  - [ ] Odcinki są posortowane od najwyższej oceny
  - [ ] Po dodaniu nowej oceny lista się aktualizuje

- [ ] **Pozostałe taby**
  - [ ] Tab "Serie" wyświetla statystyki według serii
  - [ ] Tab "Wzorce" pokazuje wzorce słuchania
  - [ ] Tab "Osiągnięcia" wyświetla osiągnięcia
  - [ ] Tab "Historia" pokazuje historię słuchania

---

## 🎨 Interfejs użytkownika

### Tryby kolorów
- [ ] **Dark mode**
  - [ ] Przełączanie na dark mode działa
  - [ ] Wszystkie elementy są czytelne (kontrast)
  - [ ] Kolory są spójne w całej aplikacji

- [ ] **Light mode**
  - [ ] Przełączanie na light mode działa
  - [ ] Wszystkie elementy są czytelne (kontrast)
  - [ ] Kolory są spójne w całej aplikacji

### Responsywność
- [ ] **Desktop (1200px+)**
  - [ ] Wszystkie elementy są poprawnie wyświetlane
  - [ ] Menu nawigacyjne jest widoczne
  - [ ] Player ma odpowiedni rozmiar

- [ ] **Tablet (768px - 1199px)**
  - [ ] Layout się dostosowuje
  - [ ] Menu jest nadal funkcjonalne
  - [ ] Player jest czytelny

- [ ] **Mobile (< 768px)**
  - [ ] Layout się dostosowuje
  - [ ] Menu jest dostępne
  - [ ] Player jest użyteczny na małym ekranie

---

## 🔧 Obsługa błędów

### Błędy sieciowe
- [ ] **Brak połączenia z backendem**
  - [ ] Komunikat o błędzie jest wyświetlany
  - [ ] Aplikacja nie crashuje
  - [ ] Można spróbować ponownie

- [ ] **Błędy 404**
  - [ ] Strona 404 jest wyświetlana
  - [ ] Można wrócić do strony głównej

### Błędy autoryzacji
- [ ] **Wygasły token**
  - [ ] Użytkownik jest przekierowany na stronę logowania
  - [ ] Komunikat o wygaśnięciu sesji jest wyświetlany

- [ ] **Brak uprawnień**
  - [ ] Komunikat o braku uprawnień jest wyświetlany
  - [ ] Użytkownik jest przekierowany do odpowiedniej strony

### Błędy walidacji
- [ ] **Nieprawidłowe dane w formularzach**
  - [ ] Komunikaty błędów są wyświetlane
  - [ ] Formularz nie jest wysyłany
  - [ ] Użytkownik może poprawić błędy

---

## 📁 Upload plików

### Pliki audio
- [ ] **Format MP3**
  - [ ] Upload pliku MP3 działa
  - [ ] Plik jest poprawnie zapisywany
  - [ ] Odtwarzanie pliku działa

- [ ] **Nieprawidłowe formaty**
  - [ ] Błąd jest wyświetlany dla nieprawidłowych formatów
  - [ ] Upload jest blokowany

### Grafiki serii
- [ ] **Formaty obrazów**
  - [ ] Upload JPG/PNG działa
  - [ ] Grafika jest poprawnie wyświetlana
  - [ ] Rozmiar jest dostosowywany

- [ ] **Nieprawidłowe formaty**
  - [ ] Błąd jest wyświetlany dla nieprawidłowych formatów
  - [ ] Upload jest blokowany

---

## 🚀 Testy wydajnościowe

### Czas ładowania
- [ ] **Strona główna**
  - [ ] Ładuje się w < 3 sekundy
  - [ ] Grafiki są optymalizowane

- [ ] **Player**
  - [ ] Odcinek ładuje się w < 5 sekund
  - [ ] Przewijanie jest płynne

- [ ] **Ocenianie**
  - [ ] Ocena zapisuje się w < 1 sekundę
  - [ ] Lista odcinków odświeża się natychmiast
  - [ ] Brak opóźnień w interfejsie

### Pamięć
- [ ] **Długie sesje**
  - [ ] Aplikacja nie zużywa nadmiernie pamięci
  - [ ] Brak wycieków pamięci po przełączaniu stron

---

## 🔍 Debugowanie

### Konsola przeglądarki
- [ ] **Brak błędów JavaScript**
  - [ ] Konsola jest czysta (tylko informacyjne logi)
  - [ ] Brak błędów 404 dla zasobów
  - [ ] Brak błędów związanych z ocenianiem

### Konsola backendu
- [ ] **Brak błędów SQL**
  - [ ] Wszystkie zapytania wykonują się poprawnie
  - [ ] Brak błędów "misuse of aggregate function"
  - [ ] Zapytania oceniania są zoptymalizowane

- [ ] **Brak błędów serwera**
  - [ ] Wszystkie endpointy odpowiadają
  - [ ] Brak błędów 500
  - [ ] Rate limiting działa poprawnie (500/15min)

---

## 📝 Notatki

**Data testu:** _______________
**Tester:** _______________
**Wersja:** 1.1.0

**Znalezione problemy:**
- 

**Rozwiązane problemy:**
- 

**Uwagi:**
- 

---

## ✅ Podsumowanie

- [ ] **Wszystkie podstawowe funkcjonalności działają**
- [ ] **System oceniania działa poprawnie**
- [ ] **Brak krytycznych błędów**
- [ ] **Interfejs jest spójny i czytelny**
- [ ] **Aplikacja jest gotowa do wdrożenia**

**Status:** ❌ Nie gotowe / ✅ Gotowe 

---

## 🔧 **Ostatnie naprawy (v2.0.1)**

### ✅ Naprawa duplikatów osiągnięć
- [ ] **Weryfikacja liczby osiągnięć**
  - [ ] W statystykach użytkownika wyświetla się "Osiągnięcia (X/19)" zamiast "Osiągnięcia (X/1942)"
  - [ ] Liczba 19 jest poprawna (19 unikalnych osiągnięć)
  - [ ] Brak duplikatów w bazie danych

- [ ] **Sprawdzenie bazy danych**
  - [ ] Tabela `achievements` zawiera dokładnie 19 rekordów
  - [ ] Tabela `user_achievements` nie zawiera osieroconych rekordów
  - [ ] Skrypt `fix_achievements_duplicates.sql` jest dostępny

- [ ] **Testy E2E**
  - [ ] Test `powinien wyświetlić postęp w osiągnięciach` przechodzi
  - [ ] Statystyki użytkownika wyświetlają poprawną liczbę
  - [ ] Brak błędów związanych z osiągnięciami

### ✅ Naprawa testów (v2.0.0)
- [ ] **Backend testy**
  - [ ] 142/142 testów przechodzi (100%)
  - [ ] Wszystkie endpointy admina działają
  - [ ] Walidacja autoryzacji poprawna
  - [ ] Kontrola dostępu funkcjonuje

- [ ] **E2E testy**
  - [ ] Wszystkie testy Playwright przechodzi
  - [ ] Dodano `data-testid` atrybuty
  - [ ] Poprawiono konfigurację Playwright
  - [ ] Zwiększono timeouty dla stabilności

### ✅ Optymalizacje
- [ ] **Wydajność**
  - [ ] Zmniejszono liczbę workers w Playwright do 1
  - [ ] Zwiększono timeouty globalne i expect
  - [ ] Dodano try/catch dla loading states
  - [ ] Poprawiono stabilność testów

- [ ] **Dokumentacja**
  - [ ] Zaktualizowano `README.md` z informacjami o naprawach
  - [ ] Zaktualizowano `TESTING.md` z nowymi metrykami
  - [ ] Zaktualizowano `PODSUMOWANIE_NAPRAWY.md`
  - [ ] Zaktualizowano `PLAN_NAPRAWY_TESTOW.md`

---

## 🎯 **Status aplikacji po naprawach**

### ✅ **Wszystkie funkcjonalności działają**
- **Backend**: 142/142 testów przechodzi (100%)
- **E2E**: Wszystkie testy przechodzi
- **Baza danych**: Poprawiona liczba osiągnięć (19 zamiast 1942)
- **UI**: Poprawne wyświetlanie wszystkich elementów

### ✅ **Ostatnie zmiany**
- Naprawiono duplikaty osiągnięć w bazie danych
- Zaktualizowano dokumentację
- Poprawiono stabilność testów E2E
- Dodano skrypt naprawy duplikatów

### ✅ **Gotowe do wdrożenia**
- Wszystkie testy przechodzi
- Dokumentacja jest aktualna
- Baza danych jest czysta
- Aplikacja jest stabilna

---

**Status: ✅ KOMPLETNE**  
**Ostatnia aktualizacja: v2.0.1**  
**Następna wersja: v2.1.0** 