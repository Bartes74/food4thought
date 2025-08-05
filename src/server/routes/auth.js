import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rejestracja
router.post('/register', async (req, res) => {
  const { email, password, confirmPassword, role = 'user' } = req.body;
  
  // Walidacja
  if (!email || !password) {
    return res.status(400).json({ error: 'Email i hasło są wymagane' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Hasło musi mieć minimum 6 znaków' });
  }
  
  // Sprawdź czy confirmPassword jest podane i czy pasuje do password
  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ error: 'Hasła nie są identyczne' });
  }
  
  // Walidacja roli - tylko admin może tworzyć konta z rolami
  const validRoles = ['user', 'admin', 'super_admin'];
  const requestedRole = validRoles.includes(role) ? role : 'user';
  
  // Jeśli request przychodzi z tokenem (admin tworzy konto), sprawdź uprawnienia
  let finalRole = 'user';
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      if (decoded.role === 'super_admin') {
        finalRole = requestedRole; // Super admin może nadać dowolną rolę
      } else if (decoded.role === 'admin' && requestedRole !== 'super_admin') {
        finalRole = requestedRole; // Admin może nadać rolę user lub admin
      }
    } catch (error) {
      // Token nieprawidłowy, używamy domyślnej roli
    }
  }
  
  try {
    // Hash hasła
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Dodaj użytkownika
    db.run(
      `INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)`,
      [email, hashedPassword, finalRole],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Użytkownik o tym emailu już istnieje' });
          }
          return res.status(500).json({ error: 'Błąd tworzenia użytkownika' });
        }
        
        const userId = this.lastID;
        
        // Jeśli to zwykła rejestracja (nie przez admina), zwróć token
        if (!authHeader) {
          const token = jwt.sign(
            { id: userId, email, role: finalRole },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
          );
          
          res.status(201).json({
            token,
            user: { id: userId, email, role: finalRole }
          });
        } else {
          // Jeśli admin tworzy konto, nie zwracaj tokena
          res.status(201).json({
            message: 'Użytkownik utworzony',
            user: { id: userId, email, role: finalRole }
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Logowanie
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Walidacja
  if (!email || !password) {
    return res.status(400).json({ error: 'Email i hasło są wymagane' });
  }
  
  // Znajdź użytkownika
  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
      }
      
      // Sprawdź hasło
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
      }
      
      // Generuj token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
      );
      
      // Pobierz preferencje
      const preferences = JSON.parse(user.preferences || '{}');
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          preferences
        }
      });
    }
  );
});

// Pobierz dane zalogowanego użytkownika
router.get('/me', authenticateToken, (req, res) => {
  db.get(
    'SELECT id, email, role, preferences, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
      }
      
      // Parse preferencje
      user.preferences = JSON.parse(user.preferences || '{}');
      
      res.json({ user });
    }
  );
});

// Zmiana hasła
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  
  // Walidacja
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Obecne i nowe hasło są wymagane' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Nowe hasło musi mieć minimum 6 znaków' });
  }
  
  // Pobierz użytkownika
  db.get(
    'SELECT password_hash FROM users WHERE id = ?',
    [userId],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
      }
      
      // Sprawdź obecne hasło
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Nieprawidłowe obecne hasło' });
      }
      
      // Hash nowego hasła
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Zaktualizuj hasło
      db.run(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [hashedPassword, userId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Błąd aktualizacji hasła' });
          }
          
          res.json({ message: 'Hasło zostało zmienione' });
        }
      );
    }
  );
});

// Reset hasła (generowanie tokenu)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email jest wymagany' });
  }
  
  // Znajdź użytkownika
  db.get(
    'SELECT id FROM users WHERE email = ?',
    [email],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      
      // Zawsze zwracaj sukces dla bezpieczeństwa
      if (!user) {
        return res.json({ message: 'Jeśli podany email istnieje, otrzymasz link do resetowania hasła' });
      }
      
      // Generuj token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 3600000); // 1 godzina
      
      // Zapisz token
      db.run(
        'INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)',
        [token, user.id, expiresAt.toISOString()],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Błąd generowania tokenu' });
          }
          
          // W prawdziwej aplikacji wysłałbyś email z linkiem
          // Tutaj zwracamy token dla celów testowych
          res.json({ 
            message: 'Link do resetowania hasła został wysłany',
            token: token // Usuń to w produkcji!
          });
        }
      );
    }
  );
});

// Reset hasła (ustawienie nowego hasła)
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token i nowe hasło są wymagane' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Hasło musi mieć minimum 6 znaków' });
  }
  
  // Sprawdź token
  db.get(
    'SELECT user_id FROM password_resets WHERE token = ? AND expires_at > datetime("now") AND used = 0',
    [token],
    async (err, reset) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      
      if (!reset) {
        return res.status(400).json({ error: 'Nieprawidłowy lub wygasły token' });
      }
      
      // Hash nowego hasła
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Zaktualizuj hasło
      db.run(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [hashedPassword, reset.user_id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Błąd aktualizacji hasła' });
          }
          
          // Oznacz token jako użyty
          db.run(
            'UPDATE password_resets SET used = 1 WHERE token = ?',
            [token],
            (err) => {
              if (err) {
                console.error('Błąd oznaczania tokenu jako użyty:', err);
              }
            }
          );
          
          res.json({ message: 'Hasło zostało zresetowane' });
        }
      );
    }
  );
});

export default router;