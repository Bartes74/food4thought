# Konfiguracja wysyłania emaili

## Konfiguracja Zenbox SMTP (AKTUALNA)

### Konfiguracja jest już ustawiona!
Aplikacja jest skonfigurowana do używania serwera SMTP Zenbox:

```env
# Email Configuration (Zenbox SMTP)
EMAIL_HOST=smtp.zenbox.pl
EMAIL_PORT=587
EMAIL_USER=food4thought@dajer.pl
EMAIL_PASS=Dunczyk1974!
EMAIL_FROM=food4thought@dajer.pl

# Application Configuration
BASE_URL=http://localhost:3000
JWT_SECRET=your-secret-key-change-this-in-production
```

### Testowanie
1. Uruchom serwer: `npm start`
2. Zarejestruj nowego użytkownika
3. Sprawdź email na `food4thought@dajer.pl`
4. Kliknij link weryfikacyjny w emailu

## Alternatywne konfiguracje

### Gmail
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**Instrukcje Gmail:**
1. Włącz weryfikację dwuetapową na https://myaccount.google.com/security
2. Wygeneruj hasło aplikacji na https://myaccount.google.com/apppasswords
3. Użyj tego hasła jako EMAIL_PASS

## Alternatywne serwery SMTP

### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

## Testowanie

Po skonfigurowaniu, zarejestruj nowego użytkownika:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!","confirmPassword":"TestPassword123!"}'
```

Powinieneś otrzymać email z linkiem weryfikacyjnym.

## Bezpieczeństwo

- Nigdy nie commituj pliku `.env` do repozytorium
- Używaj haseł aplikacji zamiast głównego hasła
- W produkcji używaj silnego JWT_SECRET
