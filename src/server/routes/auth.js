import express from 'express';
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
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
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
    
    // Wysłanie emaila weryfikacyjnego
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    await sendVerificationEmail(email, verificationUrl);
    
    res.status(201).json({
      message: 'Konto zostało utworzone. Sprawdź swój email, aby potwierdzić adres.',
      user: { id: result.lastID, email, role: 'user', email_verified: false },
      verificationToken: verificationToken // Dodajemy token do odpowiedzi
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
    const db = await getDb();
    const user = await db.get('SELECT id, email, email_verified FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email jest już zweryfikowany' });
    }
    
    // Generowanie nowego tokenu
    const verificationToken = generateVerificationToken(user.id, user.email);
    await saveVerificationToken(user.id, verificationToken);
    
    // Wysłanie emaila
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    await sendVerificationEmail(email, verificationUrl);
    
    res.json({ message: 'Email weryfikacyjny został ponownie wysłany' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Błąd serwera podczas wysyłania emaila' });
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

export default router;