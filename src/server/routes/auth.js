import express from 'express';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { validatePassword } from '../utils/passwordValidator.js';
import { 
  generateVerificationToken, 
  saveVerificationToken, 
  sendVerificationEmail,
  verifyEmailToken,
  checkVerificationToken,
  markTokenAsUsed,
  markUserAsVerified
} from '../utils/emailVerification.js';

const router = express.Router();

const getJwtSecretOrRespond = (res) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Brak konfiguracji JWT_SECRET na serwerze' });
    return null;
  }
  return secret;
};

// Logowanie
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email i hasło są wymagane' });
  }
  
  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    }
    
    // Sprawdzenie czy email jest zweryfikowany
    if (!user.email_verified) {
      return res.status(401).json({ 
        error: 'Email nie został zweryfikowany. Sprawdź swoją skrzynkę email i kliknij link weryfikacyjny.',
        needsVerification: true
      });
    }
    
    const jwtSecret = getJwtSecretOrRespond(res);
    if (!jwtSecret) return;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '30d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Rejestracja
router.post('/register', async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  
  // Walidacja wymaganych pól
  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Email, hasło i potwierdzenie hasła są wymagane' });
  }
  
  // Sprawdzenie czy hasła są identyczne
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Hasła nie są identyczne' });
  }
  
  // Walidacja siły hasła
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ 
      error: 'Hasło nie spełnia wymagań bezpieczeństwa',
      details: passwordValidation.errors
    });
  }
  
  try {
    const jwtSecret = getJwtSecretOrRespond(res);
    if (!jwtSecret) return;

    const db = await getDb();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Sprawdzenie czy email już istnieje
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Użytkownik o tym emailu już istnieje' });
    }
    
    // Utworzenie użytkownika (email_verified = 0 domyślnie)
    const result = await db.run(
      'INSERT INTO users (email, password_hash, role, email_verified) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, 'user', 0]
    );
    
    // Generowanie tokenu weryfikacyjnego
    const verificationToken = generateVerificationToken(result.lastID, email);
    await saveVerificationToken(result.lastID, verificationToken);
    
    // Wysłanie emaila weryfikacyjnego - nie przerwaj rejestracji jeśli się nie uda
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    try {
      await sendVerificationEmail(email, verificationUrl);
    } catch (emailError) {
      console.error('Email sending failed during registration, but continuing:', emailError);
      // Nie rzucamy błędu - rejestracja powinna się udać nawet jeśli email się nie wyśle
    }
    
    res.status(201).json({
      message: 'Konto zostało utworzone. Sprawdź swój email, aby potwierdzić adres.',
      user: { id: result.lastID, email, role: 'user', email_verified: false }
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Błąd serwera podczas rejestracji' });
  }
});

// Weryfikacja email
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ error: 'Token weryfikacyjny jest wymagany' });
  }
  
  try {
    // Weryfikacja tokenu
    const decoded = verifyEmailToken(token);
    
    // Sprawdzenie czy token istnieje w bazie i nie został użyty
    const verification = await checkVerificationToken(token);
    if (!verification) {
      return res.status(400).json({ error: 'Token weryfikacyjny jest nieprawidłowy lub wygasł' });
    }
    
    // Oznaczenie tokenu jako użyty
    await markTokenAsUsed(token);
    
    // Oznaczenie użytkownika jako zweryfikowanego
    await markUserAsVerified(decoded.userId);
    
    res.json({ 
      message: 'Adres email został pomyślnie zweryfikowany. Możesz się teraz zalogować.' 
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(400).json({ error: 'Token weryfikacyjny jest nieprawidłowy lub wygasł' });
  }
});

// Ponowne wysłanie emaila weryfikacyjnego
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email jest wymagany' });
  }
  
  try {
    const genericResponse = {
      message: 'Jeśli konto istnieje i nie jest zweryfikowane, wysłaliśmy email weryfikacyjny.'
    };

    const db = await getDb();
    const user = await db.get('SELECT id, email, email_verified FROM users WHERE email = ?', [email]);
    
    if (!user || user.email_verified) {
      return res.json(genericResponse);
    }
    
    // Generowanie nowego tokenu
    const verificationToken = generateVerificationToken(user.id, user.email);
    await saveVerificationToken(user.id, verificationToken);
    
    // Wysłanie emaila
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    await sendVerificationEmail(email, verificationUrl);
    
    return res.json(genericResponse);
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Błąd serwera podczas wysyłania emaila' });
  }
});

// Żądanie resetu hasła
router.post('/reset-password-request', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email jest wymagany' });
  }

  try {
    const db = await getDb();
    const user = await db.get('SELECT id, email FROM users WHERE email = ?', [email]);

    // Odpowiedź zawsze taka sama (bez ujawniania czy konto istnieje)
    const genericResponse = {
      message: 'Jeśli konto istnieje, wysłaliśmy instrukcję resetu hasła.'
    };

    if (!user) {
      return res.json(genericResponse);
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

    await db.run('DELETE FROM password_resets WHERE user_id = ?', [user.id]);
    await db.run(
      'INSERT INTO password_resets (token, user_id, expires_at, used) VALUES (?, ?, ?, 0)',
      [token, user.id, expiresAt]
    );

    if (process.env.NODE_ENV !== 'production') {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      console.log('🔐 Password reset link (dev):', `${baseUrl}/reset-password?token=${token}`);
    }

    return res.json(genericResponse);
  } catch (error) {
    console.error('Reset password request error:', error);
    return res.status(500).json({ error: 'Błąd serwera podczas resetu hasła' });
  }
});

// Zakończenie resetu hasła
router.post('/reset-password', async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Token, hasło i potwierdzenie hasła są wymagane' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Hasła nie są identyczne' });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      error: 'Hasło nie spełnia wymagań bezpieczeństwa',
      details: passwordValidation.errors
    });
  }

  try {
    const db = await getDb();
    const resetEntry = await db.get(
      'SELECT token, user_id FROM password_resets WHERE token = ? AND used = 0 AND expires_at > ?',
      [token, new Date().toISOString()]
    );

    if (!resetEntry) {
      return res.status(400).json({ error: 'Token resetu hasła jest nieprawidłowy lub wygasł' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [
      hashedPassword,
      resetEntry.user_id
    ]);
    await db.run('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);

    res.json({ message: 'Hasło zostało zaktualizowane' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Błąd serwera podczas resetu hasła' });
  }
});

// Pobierz dane zalogowanego użytkownika
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get(
      'SELECT id, email, role, email_verified, preferences FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    // Parsuj preferencje z JSON
    let preferences = {};
    if (user.preferences) {
      try {
        const parsedPrefs = JSON.parse(user.preferences);
        // Sprawdź czy preferencje nie są zagnieżdżone
        preferences = parsedPrefs.preferences || parsedPrefs;
      } catch (e) {
        console.error('Error parsing user preferences:', e);
        preferences = {};
      }
    }
    
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
        preferences: preferences
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Wylogowanie użytkownika
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // W JWT nie ma potrzeby invalidacji tokenu po stronie serwera
    // Token będzie nieważny po stronie klienta
    res.json({ message: 'Wylogowano pomyślnie' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Odświeżanie tokenu
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const jwtSecret = getJwtSecretOrRespond(res);
    if (!jwtSecret) return;

    const db = await getDb();
    const user = await db.get(
      'SELECT id, email, role FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    // Generuj nowy token
    const newToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '30d' }
    );
    
    res.json({
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
