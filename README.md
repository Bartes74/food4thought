# Food 4 Thought

Aplikacja do zarządzania i odtwarzania podcastów/audiobooków z zaawansowanym systemem śledzenia postępów, osiągnięć i statystyk.

## 🚀 Funkcje

- **🎧 Odtwarzanie audio** - Wbudowany odtwarzacz z kontrolami
- **📊 Statystyki użytkownika** - Szczegółowe statystyki słuchania
- **🏆 System osiągnięć** - 30 osiągnięć w 10 kategoriach
- **❤️ Ulubione** - Dodawanie/usuwanie odcinków do ulubionych
- **⭐ Oceny** - System oceniania odcinków
- **📝 Tematy odcinków** - Wyświetlanie tematów z timestampami
- **🌙 Dark mode** - Obsługa trybu ciemnego
- **🌍 Wielojęzyczność** - Polski, angielski, francuski
- **👥 Role użytkowników** - User, Admin, Super Admin
- **📈 Panel administratora** - Statystyki i zarządzanie

## 🛠️ Technologie

- **Backend**: Node.js, Express.js, SQLite
- **Frontend**: React, Vite, Tailwind CSS
- **Autoryzacja**: JWT
- **Testy**: Jest, Playwright
- **Deployment**: GitHub Actions

## 📦 Instalacja

```bash
# Klonuj repozytorium
git clone <repository-url>
cd food4thought

# Zainstaluj zależności
npm install

# Uruchom serwer (port 3001)
npm start

# W nowym terminalu uruchom frontend (port 3000)
npm run client
```

## 🗄️ Struktura bazy danych

### Tabele główne:
- `users` - Użytkownicy i ich role
- `series` - Seriale/podcasty
- `episodes` - Odcinki
- `user_progress` - Postęp użytkowników
- `user_favorites` - Ulubione odcinki
- `ratings` - Oceny odcinków
- `user_stats` - Statystyki użytkowników
- `listening_sessions` - Sesje słuchania
- `achievements` - Osiągnięcia
- `user_achievements` - Osiągnięcia użytkowników

## 🔌 API Endpoints

### Autoryzacja
- `POST /api/auth/login` - Logowanie
- `POST /api/auth/register` - Rejestracja
- `GET /api/auth/me` - Informacje o użytkowniku

### Odcinki
- `GET /api/episodes` - Wszystkie odcinki
- `GET /api/episodes/my` - Odcinki użytkownika
- `GET /api/episodes/:id` - Szczegóły odcinka
- `GET /api/episodes/:id/topics` - Tematy odcinka
- `POST /api/episodes/:id/links` - Zapisz tematy (admin)
- `POST /api/episodes/:id/progress` - Zapisz postęp
- `POST /api/episodes/:id/favorite` - Dodaj do ulubionych
- `DELETE /api/episodes/:id/favorite` - Usuń z ulubionych
- `POST /api/episodes/:id/rating` - Oceń odcinek

### Użytkownicy
- `GET /api/users/:id/stats` - Statystyki użytkownika
- `PUT /api/users/:id/preferences` - Aktualizuj preferencje

### Osiągnięcia
- `GET /api/achievements` — zwraca listę osiągnięć z postępem użytkownika oraz statystyki. Każde osiągnięcie zawiera m.in. pola:
  - `requirement_type`, `requirement_value`, `category`, `is_hidden`
  - `progress_value` (wyliczane live z `listening_sessions`), `completed`, `earned_at`
  - przykładowe typy: `high_speed_listening_time`, `perfect_completions`, `night_owl_sessions`, `early_bird_sessions`, `daily_episodes_count`, `episodes_completed`, `current_streak`
- `POST /api/achievements/record-session` — zapisuje sesję słuchania i aktualizuje statystyki/osiągnięcia. Wymagane pola body:
  ```json
  {
    "episodeId": 123,
    "startTime": "2025-07-31T12:00:00.000Z",
    "endTime": "2025-07-31T12:30:00.000Z",
    "playbackSpeed": 1.5,
    "completionRate": 1.0,
    "durationSeconds": 1800
  }
  ```

### Odcinki (zarządzanie tematami)
- `GET /api/episodes/:id/topics` — parsuje i zwraca tematy z pliku arkusza (`public/arkusze/seria{series_id}/{filename}.txt`).
- `POST /api/episodes/:id/topics` (admin) — zapisuje tematy do wyżej wymienionego pliku (`content` w body).

Uwaga: obecnie backend nie udostępnia `POST /api/episodes` ani `PUT /api/episodes/:id` do ogólnej edycji metadanych — UI zarządzania odcinkami wykorzystuje zapis/odczyt tematów przez `/topics`.

### Administrator
- `GET /api/admin-stats` - Statystyki systemu
- `GET /api/admin/users` - Lista użytkowników

## 📁 Struktura plików

```
food4thought/
├── src/
│   ├── client/          # Frontend React
│   │   ├── components/  # Komponenty
│   │   ├── pages/       # Strony
│   │   ├── contexts/    # Konteksty React
│   │   └── styles/      # Style CSS
│   └── server/          # Backend Node.js
│       ├── routes/      # Endpointy API
│       ├── middleware/  # Middleware
│       ├── models/      # Modele danych
│       └── utils/       # Narzędzia
├── public/
│   ├── audio/           # Pliki audio
│   ├── arkusze/         # Pliki z tematami
│   └── series-images/   # Obrazy serii
└── data/                # Baza danych SQLite
```

## 🧪 Testy

```bash
# Testy jednostkowe
npm test

# Testy integracyjne
npm run test:integration

# Testy E2E
npm run test:e2e

# Pokrycie testów
npm run test:coverage
```

## 🚀 Deployment

Aplikacja używa GitHub Actions do automatycznego deploymentu:

1. Push do `main` branch
2. Automatyczne testy
3. Build aplikacji
4. Deployment na serwer

## 📝 Changelog

### v2.2.0 (Aktualna)
- ✅ System ulubionych
- ✅ Zaawansowane statystyki użytkownika
- ✅ System osiągnięć (30 osiągnięć w 10 kategoriach)
- ✅ Lista ukończonych odcinków
- ✅ Ulepszenia dark mode
- ✅ Organizacja strony osiągnięć
- ✅ Zapisywanie tematów odcinków
- ♻️ Usunięto automatyczne odtwarzanie i wyczyszczono związany kod/DB
- 🌍 Usprawnienia i18n (EN/FR), w tym tłumaczenia nazw osiągnięć
- ✅ Aktualizacja dokumentacji

### v2.1.0
- ✅ Podstawowe statystyki
- ✅ System ocen
- ✅ Dark mode
- ✅ Wielojęzyczność

### v2.0.0
- ✅ Podstawowa funkcjonalność
- ✅ Autoryzacja
- ✅ Odtwarzanie audio

## 🔮 Planowane funkcje

### 🎯 Funkcje priorytetowe

#### 1. **System powiadomień**
- Powiadomienia o nowych odcinkach w ulubionych seriach
- Przypomnienia o przerwanych odcinkach
- Powiadomienia o osiągnięciach
- Email/SMS notifications

#### 2. **Zaawansowane statystyki**
- Wykresy słuchania w czasie (dziennie/tygodniowo/miesięcznie)
- Analiza preferencji (ulubione serie, godziny słuchania)
- Eksport danych do CSV/PDF
- Porównanie z innymi użytkownikami

#### 3. **System rekomendacji**
- "Podobne odcinki" na podstawie historii słuchania
- "Może Ci się spodobać" na podstawie ocen
- Personalizowane rekomendacje

#### 4. **Funkcje społecznościowe**
- Komentarze do odcinków
- Recenzje użytkowników
- System follow/unfollow innych użytkowników
- Udostępnianie list odcinków

### 🔧 Funkcje techniczne

#### 5. **Zaawansowane zarządzanie odcinkami**
- Bulk import/export odcinków
- Automatyczne tagowanie
- System kategorii i tagów
- Wyszukiwanie zaawansowane

#### 6. **Ulepszenia odtwarzacza**
- Playlisty
- Sleep timer
- Kontrola gestami
- Mini player

#### 7. **Backup i synchronizacja**
- Synchronizacja między urządzeniami
- Backup ustawień i postępów
- Eksport/import danych użytkownika

### 📱 Funkcje mobilne

#### 8. **Aplikacja mobilna**
- PWA (Progressive Web App)
- Offline mode
- Push notifications
- Synchronizacja z urządzeniami

#### 9. **Integracje zewnętrzne**
- Import z Spotify/Apple Podcasts
- Integracja z kalendarzem
- Eksport do Notion/Roam Research

### 🎨 Funkcje UX/UI

#### 10. **Personalizacja**
- Własne motywy kolorystyczne
- Układ interfejsu (list/grid)
- Skróty klawiszowe
- Dark/Light mode toggle

#### 11. **Funkcje dostępności**
- Screen reader support
- Kontrasty dla daltonistów
- Skróty klawiszowe
- Voice commands

### 📊 Funkcje analityczne

#### 12. **Dashboard administratora**
- Analityka użytkowników
- Popularne odcinki/serie
- Raporty aktywności
- Zarządzanie treścią

#### 13. **System gamifikacji**
- Wyzwania (np. "Słuchaj 7 dni z rzędu")
- Rankingi użytkowników
- System punktów
- Odznaki za specjalne osiągnięcia

## 🤝 Kontrybucja

1. Fork projektu
2. Utwórz feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit zmian (`git commit -m 'Add some AmazingFeature'`)
4. Push do branch (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

## 📄 Licencja

Ten projekt jest licencjonowany pod MIT License.

---

**Food 4 Thought** - Twoja osobista biblioteka audio z inteligentnym systemem śledzenia postępów! 🎧✨ 