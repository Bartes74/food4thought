# Food 4 Thought - Aplikacja do słuchania podcastów o AI

Aplikacja webowa do słuchania i zarządzania podcastami o sztucznej inteligencji, z systemem osiągnięć, statystykami, zarządzaniem użytkownikami i systemem powiadomień administratorów.

## 🚀 Funkcjonalności

### Dla użytkowników:
- **Słuchanie podcastów** - odtwarzacz audio z kontrolą prędkości
- **System osiągnięć** - 18 różnych osiągnięć do zdobycia
- **Statystyki osobiste** - śledzenie postępów i czasu słuchania
- **Ulubione** - zapisywanie ulubionych odcinków
- **Oceny i komentarze** - ocenianie i komentowanie odcinków
- **Weryfikacja email** - system potwierdzania adresu email
- **Powiadomienia administratorów** - wyświetlanie informacji od adminów z możliwością odrzucenia

### Dla administratorów:
- **Panel administracyjny** - zarządzanie użytkownikami i treściami
- **Statystyki systemu** - przegląd aktywności użytkowników z filtrami czasowymi
- **Zarządzanie seriami** - dodawanie i edycja serii podcastów
- **Zarządzanie odcinkami** - upload i edycja odcinków
- **System powiadomień** - tworzenie i zarządzanie powiadomieniami dla użytkowników z pełnymi statystykami

## 🛠️ Technologie

- **Frontend**: React.js, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Baza danych**: SQLite
- **Autentykacja**: JWT (JSON Web Tokens)
- **Email**: Nodemailer (z fallback na mock)
- **Testy**: Playwright (E2E), Node.js scripts

## 📦 Instalacja

1. **Klonuj repozytorium:**
```bash
git clone <repository-url>
cd food4thought
```

2. **Zainstaluj zależności:**
```bash
npm install
```

3. **Uruchom aplikację:**
```bash
# Uruchom serwer (port 3001)
npm start

# W nowym terminalu uruchom klienta (port 3000)
npm run client
```

## 🧪 Testy

### Skrypty testowe:
```bash
# Test rejestracji użytkowników (interaktywny)
npm run test:register

# Test rejestracji użytkowników (batch)
npm run test:register:batch

# Test zarządzania użytkownikami (user, admin, super-admin)
npm run test:users

# Test systemu powiadomień administratorów
npm run test:notifications

# Sprawdź aktywne tokeny weryfikacyjne
npm run check:tokens
```

### Testy E2E:
```bash
# Uruchom testy Playwright
npm run test:e2e

# Uruchom testy z UI
npm run test:e2e:ui
```

## 🔧 Konfiguracja

### Zmienne środowiskowe:
```env
# Email (opcjonalne - aplikacja używa fallback)
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password

# JWT Secret (automatycznie generowany)
JWT_SECRET=your-jwt-secret
```

### Baza danych:
- Automatyczna inicjalizacja przy pierwszym uruchomieniu
- Wszystkie tabele i dane początkowe są tworzone automatycznie
- System osiągnięć jest inicjalizowany z 18 predefiniowanymi osiągnięciami
- System powiadomień administratorów z tabelami `admin_notifications` i `notification_stats`

## 📊 Struktura bazy danych

### Główne tabele:
- `users` - użytkownicy systemu
- `series` - serie podcastów
- `episodes` - odcinki podcastów
- `user_progress` - postęp użytkowników
- `user_stats` - statystyki użytkowników
- `achievements` - system osiągnięć
- `user_achievements` - osiągnięcia użytkowników
- `ratings` - oceny odcinków
- `comments` - komentarze
- `user_favorites` - ulubione odcinki
- `admin_notifications` - powiadomienia administratorów
- `notification_stats` - statystyki powiadomień

## 🎯 System osiągnięć

Aplikacja zawiera 18 różnych osiągnięć w kategoriach:
- **Streaks** - słuchanie przez kolejne dni
- **Precision** - dokładne ukończenie odcinków
- **Speed** - słuchanie z wysoką prędkością
- **Daily Activity** - aktywność dzienna
- **Time Patterns** - wzorce czasowe (nocne/poranne słuchanie)
- **General** - ogólne osiągnięcia

## 📢 System powiadomień administratorów

### Funkcjonalności:
- **Tworzenie powiadomień** - administratorzy mogą tworzyć powiadomienia z tytułem i treścią
- **Wyświetlanie użytkownikom** - powiadomienia pojawiają się na górze aplikacji
- **Nawigacja** - użytkownicy mogą przechodzić między wieloma powiadomieniami
- **Odrzucanie** - użytkownicy mogą odrzucić powiadomienie (nie pokazuj więcej)
- **Statystyki** - pełne statystyki wyświetleń i odrzuceń dla każdego powiadomienia
- **Zarządzanie** - aktywacja/dezaktywacja i usuwanie powiadomień

### Logika wyświetlania:
- Powiadomienia pokazują się maksymalnie 3 razy (jeśli użytkownik nie odrzuci)
- Po odrzuceniu powiadomienie nie pojawia się więcej
- Administratorzy widzą szczegółowe statystyki dla każdego powiadomienia

## 🔐 Bezpieczeństwo

- **Autentykacja JWT** - bezpieczne tokeny sesji
- **Weryfikacja email** - potwierdzanie adresów email
- **Role użytkowników** - user, admin, super_admin
- **Ochrona endpointów** - middleware autoryzacji
- **Walidacja danych** - sprawdzanie poprawności inputów

## 🐛 Znane problemy

- **Usuwanie użytkowników przez API** - nie działa dla użytkowników z danymi (błąd FOREIGN KEY)
  - **Rozwiązanie**: Skrypty testowe automatycznie czyszczą dane przez SQL
- **Email verification** - używa fallback (mock) zamiast rzeczywistego SMTP
  - **Rozwiązanie**: Ustaw zmienne środowiskowe EMAIL_USER i EMAIL_PASS

## 📝 Dokumentacja API

### Endpointy autoryzacji:
- `POST /api/auth/register` - rejestracja użytkownika
- `POST /api/auth/login` - logowanie
- `GET /api/auth/verify-email` - weryfikacja email

### Endpointy treści:
- `GET /api/series` - lista serii
- `GET /api/episodes` - lista odcinków
- `GET /api/episodes/:id` - szczegóły odcinka

### Endpointy użytkownika:
- `GET /api/users/profile` - profil użytkownika
- `PUT /api/users/profile` - aktualizacja profilu
- `GET /api/achievements` - osiągnięcia użytkownika

### Endpointy powiadomień:
- `GET /api/notifications` - powiadomienia użytkownika
- `POST /api/notifications/:id/view` - rejestrowanie wyświetlenia
- `POST /api/notifications/:id/dismiss` - odrzucanie powiadomienia

### Endpointy administratora:
- `GET /api/users` - lista wszystkich użytkowników
- `DELETE /api/users/:id` - usuwanie użytkownika
- `GET /api/admin/stats` - statystyki systemu z filtrami czasowymi
- `GET /api/notifications/admin` - lista powiadomień (admin)
- `POST /api/notifications/admin` - tworzenie powiadomienia (admin)
- `PUT /api/notifications/admin/:id` - edycja powiadomienia (admin)
- `DELETE /api/notifications/admin/:id` - usuwanie powiadomienia (admin)
- `GET /api/notifications/admin/:id/stats` - statystyki powiadomienia (admin)

## 🤝 Wkład w projekt

1. Fork repozytorium
2. Utwórz branch dla nowej funkcjonalności
3. Commit zmiany
4. Push do brancha
5. Utwórz Pull Request

## 📄 Licencja

Ten projekt jest licencjonowany pod licencją MIT.

## 🆘 Wsparcie

W przypadku problemów:
1. Sprawdź sekcję "Znane problemy"
2. Uruchom testy: `npm run test:users`
3. Sprawdź logi serwera
4. Utwórz issue w repozytorium

---

**Food 4 Thought** - Twoja podróż w świat sztucznej inteligencji przez podcasty! 🎧🤖 