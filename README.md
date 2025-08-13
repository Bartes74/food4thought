# Food 4 Thought - Aplikacja do słuchania podcastów

Aplikacja webowa do słuchania i zarządzania podcastami z zaawansowanym systemem osiągnięć, statystyk i personalizacji.

## 🚀 Funkcjonalności

### 🎧 Odtwarzanie audio
- **Odtwarzacz audio** z kontrolami (play/pause, przewijanie, prędkość)
- **Automatyczne zapisywanie postępu** co 5 sekund
- **Wznawianie od miejsca ostatniego odtwarzania**
- **Obsługa różnych prędkości odtwarzania** (0.8x, 1x, 1.25x, 1.5x, 2x)
- **Tematy odcinków** z automatycznym przełączaniem

### ❤️ System ulubionych
- **Dodawanie/usuwanie odcinków z ulubionych**
- **Strona ulubionych** z wyszukiwaniem i grupowaniem według serii
- **Szybki dostęp** do ulubionych odcinków
- **Filtrowanie i sortowanie** ulubionych

### 📊 Statystyki użytkownika
- **Całkowity czas słuchania** w formacie "Dni: 0, 00:03:39"
- **Liczba ukończonych odcinków**
- **Odcinki w trakcie słuchania**
- **Liczba ulubionych odcinków**
- **Statystyki według serii** z paskami postępu
- **Lista ukończonych odcinków** z datami i czasem trwania
- **Szczegółowe metryki** aktywności

### 🏆 System osiągnięć
- **30 osiągnięć** w 10 kategoriach (po 3 w każdej)
- **Kreatywne nazwy** z emoji i motywującymi opisami
- **Szczegółowe informacje o postępie** z procentami
- **Kategorie osiągnięć**:
  - ⚡ **Prędkość** - słuchanie z wysoką prędkością
  - 🚀 **Prędkość odtwarzania** - mistrzostwo w szybkim odtwarzaniu
  - 🎯 **Dokładność** - precyzja w słuchaniu
  - 🕐 **Wzorce czasowe** - nawyki słuchania
  - 🌙 **Wzorce czasowe** - słuchanie o różnych porach
  - 🔥 **Serie** - konsekwentne serie słuchania
  - 💪 **Wytrwałość** - regularność i wytrwałość
  - 📅 **Codzienność** - codzienna aktywność
  - 🏃 **Aktywność dzienna** - intensywna aktywność
  - 🏆 **Ogólne** - kamienie milowe

### 🎨 Personalizacja
- **Tryb ciemny/jasny** z automatycznym przełączaniem
- **Wybór języka** (polski/angielski)
- **Kolorowe serie** z indywidualnymi kolorami
- **Responsywny design** dla wszystkich urządzeń

### 👤 Zarządzanie użytkownikami
- **Rejestracja i logowanie** z weryfikacją email
- **Profile użytkowników** z preferencjami
- **System ról** (użytkownik, admin, super_admin)
- **Zarządzanie użytkownikami** przez administratorów

### 📱 Panel administratora
- **Statystyki systemu** z wykresami
- **Zarządzanie seriami** i odcinkami
- **Zarządzanie użytkownikami**
- **System powiadomień**
- **Monitorowanie aktywności**

## 🛠️ Technologie

### Backend
- **Node.js** z Express.js
- **SQLite** jako baza danych
- **JWT** do autoryzacji
- **bcrypt** do hashowania haseł
- **Nodemailer** do wysyłania emaili

### Frontend
- **React 18** z hooks
- **Vite** jako bundler
- **Tailwind CSS** do stylowania
- **Axios** do komunikacji z API
- **React Router** do nawigacji

### Narzędzia deweloperskie
- **ESLint** do lintingu
- **Prettier** do formatowania kodu
- **Playwright** do testów E2E
- **Jest** do testów jednostkowych

## 📦 Instalacja

### Wymagania
- Node.js 18+
- npm lub yarn

### Kroki instalacji

1. **Klonowanie repozytorium**
```bash
git clone <repository-url>
cd food4thought
```

2. **Instalacja zależności**
```bash
npm install
```

3. **Konfiguracja środowiska**
```bash
cp .env.example .env
# Edytuj .env i ustaw wymagane zmienne
```

4. **Inicjalizacja bazy danych**
```bash
npm run db:init
```

5. **Uruchomienie aplikacji**
```bash
# Uruchom serwer i klienta jednocześnie
npm run dev

# Lub osobno:
npm start          # Serwer na porcie 3001
npm run client     # Klient na porcie 3000
```

## 🗄️ Struktura bazy danych

### Główne tabele
- **users** - dane użytkowników
- **series** - serie podcastów
- **episodes** - odcinki podcastów
- **user_progress** - postęp użytkowników
- **user_favorites** - ulubione odcinki
- **user_stats** - statystyki użytkowników
- **listening_sessions** - sesje słuchania
- **achievements** - osiągnięcia
- **user_achievements** - postęp w osiągnięciach

## 🎯 System osiągnięć

### Przykładowe osiągnięcia
- 🏆 **Ekspert** - Ukończ 100 odcinków (500 pkt)
- ⚡ **Prędkość Światła** - Słuchaj przez 5h z prędkością 2x (50 pkt)
- 🔥 **Żelazna Wola** - Słuchaj przez 30 dni z rzędu (500 pkt)
- 🎯 **Mistrz Precyzji** - Ukończ 10 odcinków z 95%+ dokładnością (100 pkt)
- 🌙 **Nocny Marynarz** - Słuchaj 5 razy między 22:00 a 6:00 (30 pkt)

### Mechanika
- **Automatyczne śledzenie** postępu podczas słuchania
- **Real-time aktualizacje** statystyk i osiągnięć
- **Szczegółowe informacje** o tym, co trzeba zrobić
- **Punkty i ranking** dla motywacji

## 📊 Statystyki

### Metryki śledzone
- **Czas słuchania** w sekundach z formatowaniem
- **Ukończone odcinki** z completion_rate >= 0.9
- **Serie słuchania** (dni z rzędu)
- **Wzorce czasowe** (nocne, poranne sesje)
- **Prędkość odtwarzania** (wysokie prędkości)
- **Dokładność słuchania** (perfect completions)

### Wyświetlanie
- **Format czasu**: "Dni: 0, 00:03:39"
- **Paski postępu** dla serii
- **Kolorowe wskaźniki** dla różnych metryk
- **Lista ukończonych odcinków** z datami

## 🔧 API Endpoints

### Autoryzacja
- `POST /api/auth/login` - Logowanie
- `POST /api/auth/register` - Rejestracja
- `GET /api/auth/me` - Sprawdzenie sesji
- `GET /api/auth/verify-email` - Weryfikacja email

### Odcinki
- `GET /api/episodes/my` - Odcinki użytkownika
- `GET /api/episodes/favorites` - Ulubione odcinki
- `POST /api/episodes/:id/progress` - Zapisywanie postępu
- `POST /api/episodes/:id/favorite` - Dodawanie do ulubionych
- `DELETE /api/episodes/:id/favorite` - Usuwanie z ulubionych

### Statystyki
- `GET /api/users/:id/stats` - Statystyki użytkownika
- `GET /api/users/series-stats` - Statystyki według serii
- `POST /api/achievements/record-session` - Rejestrowanie sesji

### Osiągnięcia
- `GET /api/achievements` - Lista osiągnięć z postępem
- `POST /api/achievements/recalculate-stats` - Przeliczanie statystyk (admin)

## 🧪 Testy

### Uruchomienie testów
```bash
# Testy jednostkowe
npm test

# Testy E2E
npm run test:e2e

# Testy z coverage
npm run test:coverage
```

### Struktura testów
- **Unit tests** - testy jednostkowe komponentów
- **Integration tests** - testy integracji API
- **E2E tests** - testy end-to-end z Playwright

## 🚀 Deployment

### Produkcja
```bash
# Build aplikacji
npm run build

# Uruchomienie serwera produkcyjnego
npm start
```

### Docker (opcjonalnie)
```bash
# Build obrazu
docker build -t food4thought .

# Uruchomienie kontenera
docker run -p 3001:3001 food4thought
```

## 📝 Changelog

### v2.2.0 (Aktualna)
- ✅ **System osiągnięć** - 30 osiągnięć w 10 kategoriach
- ✅ **Statystyki użytkownika** - szczegółowe metryki aktywności
- ✅ **Lista ukończonych odcinków** - z datami i czasem trwania
- ✅ **System ulubionych** - pełna funkcjonalność z wyszukiwaniem
- ✅ **Naprawione liczenie statystyk** - prawidłowe obliczanie ukończonych odcinków
- ✅ **Ulepszone UI** - lepszy kontrast w trybie ciemnym
- ✅ **Organizacja osiągnięć** - kategorie z opisami i postępem

### v2.1.0
- System autoryzacji z JWT
- Panel administratora
- Zarządzanie seriami i odcinkami

### v2.0.0
- Podstawowa funkcjonalność odtwarzania
- System użytkowników
- Baza danych SQLite

## 🤝 Współtwórcy

- **Bartek** - Główny deweloper
- **AI Assistant** - Pomoc w implementacji funkcjonalności

## 📄 Licencja

MIT License - zobacz plik [LICENSE](LICENSE) dla szczegółów.

## 🆘 Wsparcie

W przypadku problemów:
1. Sprawdź [Issues](https://github.com/username/food4thought/issues)
2. Utwórz nowy issue z opisem problemu
3. Dołącz logi błędów i kroki reprodukcji

---

**Food 4 Thought** - Twoja osobista biblioteka podcastów z gamifikacją! 🎧🏆 