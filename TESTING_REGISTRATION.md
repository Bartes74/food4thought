# 🎯 Testowanie Rejestracji Użytkowników

Ten dokument opisuje różne sposoby testowania rejestracji nowych użytkowników w aplikacji Food 4 Thought.

## 🚀 Dostępne Skrypty Testowe

### 1. Interaktywny Test Rejestracji
```bash
npm run test:register
```
**Opis**: Interaktywny skrypt, który pyta o dane użytkownika i automatycznie:
- Rejestruje użytkownika
- Wyświetla link aktywacyjny
- Automatycznie weryfikuje email
- Testuje logowanie

**Przykład użycia**:
```bash
$ npm run test:register
✅ Serwer działa na http://localhost:3001
🎯 Test Rejestracji Food 4 Thought
=====================================

📧 Email: test@example.com
🔒 Hasło: TestPassword123!
🔒 Potwierdź hasło: TestPassword123!

🔄 Rejestruję użytkownika...
✅ Rejestracja udana!
👤 Użytkownik ID: 409
📧 Email: test@example.com

🔍 Pobieram link aktywacyjny...
🎉 LINK AKTYWACYJNY:
=====================================
http://localhost:3000/verify-email?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
=====================================

🔄 Automatycznie weryfikuję email...
✅ Email zweryfikowany!
📝 Wiadomość: Adres email został pomyślnie zweryfikowany. Możesz się teraz zalogować.

🔄 Testuję logowanie...
✅ Logowanie udane!
🎫 Token JWT otrzymany
👤 Użytkownik zweryfikowany: Tak
```

### 2. Batch Test Rejestracji
```bash
npm run test:register:batch [liczba_użytkowników]
```
**Opis**: Automatycznie generuje i testuje rejestrację wielu użytkowników z losowymi danymi.

**Przykład użycia**:
```bash
# Test 1 użytkownika (domyślnie)
npm run test:register:batch

# Test 5 użytkowników
npm run test:register:batch 5

# Test 10 użytkowników
npm run test:register:batch 10
```

**Przykład wyjścia**:
```bash
✅ Serwer działa na http://localhost:3001
🎯 Test Rejestracji Batch - 3 użytkowników
=====================================

🔄 Test 1/3
📧 Email: test1755035880248243@dajer.pl
🔒 Hasło: TestPassword664!
✅ Rejestracja udana!
👤 Użytkownik ID: 407
🎉 LINK AKTYWACYJNY:
http://localhost:3000/verify-email?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ Email zweryfikowany!
✅ Logowanie udane!

📊 PODSUMOWANIE TESTÓW
=====================================
✅ Udane: 3/3
❌ Nieudane: 0/3

🎉 UDANE REJESTRACJE:
1. test1755035880248243@dajer.pl (ID: 407)
   Hasło: TestPassword664!
   Link: http://localhost:3000/verify-email?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Sprawdzanie Aktywnych Tokenów
```bash
npm run check:tokens
```
**Opis**: Wyświetla wszystkie aktywne tokeny weryfikacyjne w bazie danych.

**Przykład wyjścia**:
```bash
🔍 Sprawdzanie aktywnych tokenów weryfikacyjnych
=====================================

📊 Znaleziono 5 aktywnych tokenów:

1. test@example.com (ID: 409)
   Status: ✅ Aktywny
   Utworzony: 2025-08-12 22:00:15
   Wygasa: 2025-08-13T22:00:15.123Z
   Link: http://localhost:3000/verify-email?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

🎯 NIEWYKORZYSTANE TOKENY:
=====================================
1. test@example.com
   http://localhost:3000/verify-email?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔧 Ręczne Testowanie przez API

### Rejestracja użytkownika
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!"
  }'
```

### Weryfikacja email
```bash
curl -X GET "http://localhost:3001/api/auth/verify-email?token=TOKEN_Z_BAZY_DANYCH"
```

### Logowanie
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Pobieranie tokenu z bazy danych
```bash
sqlite3 data/food4thought.db "SELECT token FROM email_verifications WHERE user_id = USER_ID ORDER BY created_at DESC LIMIT 1;"
```

## 📋 Wymagania

### Przed uruchomieniem testów:
1. **Serwer musi być uruchomiony**:
   ```bash
   npm start
   ```

2. **Baza danych musi istnieć**:
   - Automatycznie tworzona przy pierwszym uruchomieniu serwera

3. **Zależności**:
   - `node-fetch` (zainstalowane automatycznie)
   - `sqlite3` (zainstalowane)

## 🎯 Scenariusze Testowe

### 1. Test Podstawowej Rejestracji
```bash
npm run test:register
```
- Wprowadź dane użytkownika
- Sprawdź czy link aktywacyjny działa
- Zweryfikuj czy logowanie działa po aktywacji

### 2. Test Wielu Użytkowników
```bash
npm run test:register:batch 10
```
- Sprawdź czy system obsługuje wiele równoczesnych rejestracji
- Zweryfikuj czy wszystkie tokeny są unikalne

### 3. Test Wygaśnięcia Tokenów
```bash
# Sprawdź aktywne tokeny
npm run check:tokens

# Poczekaj 24 godziny i sprawdź ponownie
npm run check:tokens
```

### 4. Test Błędów
```bash
# Test z nieprawidłowym hasłem
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "confirmPassword": "InneHaslo123!"
  }'

# Test z nieprawidłowym tokenem
curl -X GET "http://localhost:3001/api/auth/verify-email?token=nieprawidłowy_token"
```

## 🔍 Debugowanie

### Sprawdzenie logów serwera
```bash
# Uruchom serwer w trybie debug
npm start

# W osobnym terminalu uruchom testy
npm run test:register
```

### Sprawdzenie bazy danych
```bash
# Otwórz bazę danych
sqlite3 data/food4thought.db

# Sprawdź użytkowników
SELECT id, email, email_verified, created_at FROM users ORDER BY created_at DESC LIMIT 10;

# Sprawdź tokeny weryfikacyjne
SELECT user_id, token, created_at, expires_at, used FROM email_verifications ORDER BY created_at DESC LIMIT 10;

# Wyjdź z sqlite
.quit
```

## 📝 Uwagi

1. **Tokeny wygasają po 24 godzinach**
2. **Każdy token może być użyty tylko raz**
3. **Emaile są wysyłane przez SMTP Zenbox**
4. **W przypadku błędu SMTP, aplikacja przełącza się na mock email**
5. **Wszystkie testy automatycznie weryfikują email i testują logowanie**

## 🚀 Szybki Start

```bash
# 1. Uruchom serwer
npm start

# 2. W nowym terminalu, przetestuj rejestrację
npm run test:register

# 3. Lub przetestuj wiele użytkowników
npm run test:register:batch 5

# 4. Sprawdź aktywne tokeny
npm run check:tokens
```
