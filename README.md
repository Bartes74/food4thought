# Food 4 Thought 🎧

Aplikacja do zarządzania podcastami i odcinkami audio z systemem osiągnięć i statystyk.

## 🚀 Funkcje

- **Zarządzanie seriami** - dodawanie, edycja i usuwanie serii podcastów
- **Zarządzanie odcinkami** - dodawanie odcinków z metadanymi, tematami i linkami
- **System ulubionych** - dodawanie odcinków do ulubionych
- **Statystyki użytkownika** - śledzenie postępów i historii słuchania
- **System osiągnięć** - odznaki za różne aktywności
- **Panel administratora** - zarządzanie użytkownikami i statystykami
- **Responsywny design** - aplikacja działa na wszystkich urządzeniach
- **Ciemny/jasny motyw** - wybór preferowanego wyglądu
- **Wielojęzyczność** - obsługa polskiego i angielskiego

## 🛠️ Technologie

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Baza danych**: SQLite3
- **Autoryzacja**: JWT
- **Testy**: Jest, Playwright

## 📦 Instalacja

1. **Sklonuj repozytorium**
   ```bash
   git clone https://github.com/Bartes74/food4thought.git
   cd food4thought
   ```

2. **Zainstaluj zależności**
   ```bash
   npm install
   ```

3. **Uruchom aplikację w trybie deweloperskim**
   ```bash
   npm run dev
   ```

4. **Otwórz przeglądarkę**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 🏗️ Struktura projektu

```
food4thought/
├── src/
│   ├── client/          # Frontend React
│   │   ├── components/  # Komponenty React
│   │   ├── contexts/    # Konteksty (Auth, Theme, Language)
│   │   ├── pages/       # Strony aplikacji
│   │   └── styles/      # Style CSS
│   └── server/          # Backend Node.js
│       ├── routes/      # Endpointy API
│       ├── middleware/  # Middleware (auth)
│       ├── models/      # Modele danych
│       └── utils/       # Narzędzia pomocnicze
├── data/                # Baza danych SQLite
├── public/              # Pliki statyczne
└── tests/               # Testy
```

## 🔧 Konfiguracja

### Zmienne środowiskowe

Utwórz plik `.env` w głównym katalogu:

```env
# Port serwera
PORT=3001

# Sekret JWT
JWT_SECRET=twój_sekret_jwt

# Tryb środowiska
NODE_ENV=development
```

### Baza danych

Aplikacja automatycznie utworzy bazę danych SQLite w katalogu `data/` przy pierwszym uruchomieniu.

## 🧪 Testy

### Testy jednostkowe
```bash
npm test
```

### Testy E2E
```bash
npm run test:e2e
```

### Testy integracyjne
```bash
npm run test:integration
```

## 📊 API Endpoints

### Autoryzacja
- `POST /api/auth/login` - Logowanie
- `POST /api/auth/register` - Rejestracja
- `GET /api/auth/me` - Informacje o użytkowniku

### Serię
- `GET /api/series` - Lista serii
- `POST /api/series` - Dodaj serię
- `PUT /api/series/:id` - Edytuj serię
- `DELETE /api/series/:id` - Usuń serię

### Odcinki
- `GET /api/episodes` - Lista odcinków
- `POST /api/episodes` - Dodaj odcinek
- `PUT /api/episodes/:id` - Edytuj odcinek
- `DELETE /api/episodes/:id` - Usuń odcinek
- `GET /api/episodes/favorites` - Ulubione odcinki
- `POST /api/episodes/:id/favorite` - Dodaj/usuń z ulubionych

### Użytkownicy
- `GET /api/users` - Lista użytkowników (admin)
- `GET /api/users/:id/stats` - Statystyki użytkownika
- `GET /api/users/series-stats` - Statystyki serii

### Osiągnięcia
- `GET /api/achievements` - Lista osiągnięć z postępem

## 🎯 Funkcje administratora

- Zarządzanie użytkownikami
- Statystyki systemu
- Zarządzanie seriami i odcinkami
- Monitorowanie aktywności

## 🎨 Motywy

Aplikacja obsługuje:
- **Jasny motyw** - domyślny
- **Ciemny motyw** - dla lepszego komfortu w nocy

## 🌍 Języki

- **Polski** - domyślny
- **Angielski** - w przygotowaniu

## 🤝 Współpraca

1. Fork repozytorium
2. Utwórz branch dla nowej funkcji (`git checkout -b feature/amazing-feature`)
3. Commit zmian (`git commit -m 'Add amazing feature'`)
4. Push do branch (`git push origin feature/amazing-feature`)
5. Otwórz Pull Request

## 📝 Licencja

Ten projekt jest dostępny na licencji MIT. Zobacz plik `LICENSE` dla szczegółów.

## 🐛 Raportowanie błędów

Jeśli znajdziesz błąd, utwórz issue w repozytorium GitHub z opisem problemu.

## ✨ Podziękowania

Dziękujemy wszystkim, którzy przyczynili się do rozwoju tej aplikacji!

---

**Food 4 Thought** - Organizuj swoje podcasty, śledź postępy, zdobywaj osiągnięcia! 🎧✨ 