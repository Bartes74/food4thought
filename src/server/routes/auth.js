import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

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
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Rejestracja
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email i hasło są wymagane' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Hasło musi mieć minimum 6 znaków' });
  }
  
  try {
    const db = await getDb();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.run(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, hashedPassword, 'user']
    );
    
    const token = jwt.sign(
      { id: result.lastID, email, role: 'user' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      token,
      user: { id: result.lastID, email, role: 'user' }
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Użytkownik o tym emailu już istnieje' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz dane zalogowanego użytkownika
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get(
      'SELECT id, email, role FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;