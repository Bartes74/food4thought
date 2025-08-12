# Food 4 Thought - Aplikacja do słuchania podcastów o AI

Aplikacja webowa do słuchania i zarządzania podcastami o sztucznej inteligencji, z systemem osiągnięć, statystykami i zarządzaniem użytkownikami.

## 🚀 Funkcjonalności

### Dla użytkowników:
- **Słuchanie podcastów** - odtwarzacz audio z kontrolą prędkości
- **System osiągnięć** - 18 różnych osiągnięć do zdobycia
- **Statystyki osobiste** - śledzenie postępów i czasu słuchania
- **Ulubione** - zapisywanie ulubionych odcinków
- **Oceny i komentarze** - ocenianie i komentowanie odcinków
- **Weryfikacja email** - system potwierdzania adresu email

### Dla administratorów:
- **Panel administracyjny** - zarządzanie użytkownikami i treściami
- **Statystyki systemu** - przegląd aktywności użytkowników
- **Zarządzanie seriami** - dodawanie i edycja serii podcastów
- **Zarządzanie odcinkami** - upload i edycja odcinków

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

## 🎯 System osiągnięć

Aplikacja zawiera 18 różnych osiągnięć w kategoriach:
- **Streaks** - słuchanie przez kolejne dni
- **Precision** - dokładne ukończenie odcinków
- **Speed** - słuchanie z wysoką prędkością
- **Daily Activity** - aktywność dzienna
- **Time Patterns** - wzorce czasowe (nocne/poranne słuchanie)
- **General** - ogólne osiągnięcia

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
- `POST /api/auth/verify-email` - weryfikacja email

### Endpointy treści:
- `GET /api/series` - lista serii
- `GET /api/episodes` - lista odcinków
- `GET /api/episodes/:id` - szczegóły odcinka

### Endpointy użytkownika:
- `GET /api/users/profile` - profil użytkownika
- `PUT /api/users/profile` - aktualizacja profilu
- `GET /api/achievements` - osiągnięcia użytkownika

### Endpointy administratora:
- `GET /api/users` - lista wszystkich użytkowników
- `DELETE /api/users/:id` - usuwanie użytkownika
- `GET /api/admin/stats` - statystyki systemu

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