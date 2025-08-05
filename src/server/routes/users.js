import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Aktualizuj preferencje użytkownika
router.put('/preferences', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const preferences = req.body;
  
  // Walidacja
  const validLanguages = ['polski', 'en', 'fr'];
  const validAudioLanguages = ['polski', 'angielski', 'francuski'];
  const validSpeeds = [0.8, 1, 1.25, 1.5, 2];
  
  if (preferences.language && !validLanguages.includes(preferences.language)) {
    return res.status(400).json({ error: 'Nieprawidłowy język interfejsu' });
  }
  
  if (preferences.audioLanguage && !validAudioLanguages.includes(preferences.audioLanguage)) {
    return res.status(400).json({ error: 'Nieprawidłowy język audio' });
  }
  
  if (preferences.playbackSpeed && !validSpeeds.includes(preferences.playbackSpeed)) {
    return res.status(400).json({ error: 'Nieprawidłowa prędkość odtwarzania' });
  }
  
  // Zapisz preferencje
  db.run(
    `UPDATE users SET preferences = ? WHERE id = ?`,
    [JSON.stringify(preferences), userId],
    (err) => {
      if (err) {
        console.error('Błąd aktualizacji preferencji:', err);
        return res.status(500).json({ error: 'Błąd aktualizacji preferencji' });
      }
      
      res.json({ message: 'Preferencje zaktualizowane' });
    }
  );
});

// Pobierz listę użytkowników (tylko admin)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  db.all(
    `SELECT id, email, role, created_at, email_verified FROM users ORDER BY created_at DESC`,
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd pobierania użytkowników' });
      }
      
      res.json(users);
    }
  );
});

// Pobierz szczegóły użytkownika (admin lub własne konto)
router.get('/:id', authenticateToken, (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Sprawdź uprawnienia
  if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Brak uprawnień' });
  }
  
  db.get(
    `SELECT id, email, role, preferences, created_at FROM users WHERE id = ?`,
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd pobierania użytkownika' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
      }
      
      user.preferences = JSON.parse(user.preferences || '{}');
      res.json(user);
    }
  );
});

// Statystyki użytkownika
router.get('/:id/stats', authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Sprawdź uprawnienia
  if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Brak uprawnień' });
  }
  
  const stats = {
    completedCount: 0,      // ZMIANA: bylo completedEpisodes
    inProgressCount: 0,     // ZMIANA: bylo inProgressEpisodes  
    favoritesCount: 0,      // ZMIANA: bylo favoriteEpisodes
    totalListeningTime: 0   // Czas w MINUTACH, nie sekundach
  };
  
  // Użyj Promise.all dla równoległych zapytań
  await Promise.all([
    // Liczba odsłuchanych odcinków
    new Promise((resolve) => {
      db.get(
        `SELECT COUNT(*) as completed FROM user_progress WHERE user_id = ? AND completed = 1`,
        [userId],
        (err, result) => {
          if (!err) stats.completedCount = result.completed;
          resolve();
        }
      );
    }),
    
    // Liczba odcinków w trakcie
    new Promise((resolve) => {
      db.get(
        `SELECT COUNT(*) as inProgress FROM user_progress WHERE user_id = ? AND completed = 0 AND position > 0`,
        [userId],
        (err, result) => {
          if (!err) stats.inProgressCount = result.inProgress;
          resolve();
        }
      );
    }),
    
    // Liczba ulubionych
    new Promise((resolve) => {
      db.get(
        `SELECT COUNT(*) as favorites FROM user_favorites WHERE user_id = ?`,
        [userId],
        (err, result) => {
          if (!err) stats.favoritesCount = result.favorites;
          resolve();
        }
      );
    }),
    
    // Całkowity czas słuchania (konwertuj sekundy na minuty)
    new Promise((resolve) => {
      db.get(
        `SELECT SUM(position) as totalTime FROM user_progress WHERE user_id = ?`,
        [userId],
        (err, result) => {
          if (!err) {
            // Konwertuj sekundy na minuty
            stats.totalListeningTime = Math.round((result.totalTime || 0) / 60);
          }
          resolve();
        }
      );
    })
  ]);
  

  res.json(stats);
});

// Zmień rolę użytkownika (tylko super admin)
router.put('/:id/role', authenticateToken, (req, res) => {
  const userId = parseInt(req.params.id);
  const { role } = req.body;
  
  // Tylko super admin może zmieniać role
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Tylko super administrator może zmieniać role' });
  }
  
  // Nie można zmienić własnej roli
  if (req.user.id === userId) {
    return res.status(400).json({ error: 'Nie można zmienić własnej roli' });
  }
  
  // Walidacja roli
  const validRoles = ['user', 'admin', 'super_admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Nieprawidłowa rola' });
  }
  
  db.run(
    `UPDATE users SET role = ? WHERE id = ?`,
    [role, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Błąd aktualizacji roli' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
      }
      
      res.json({ message: 'Rola zaktualizowana' });
    }
  );
});

// Resetuj hasło użytkownika (tylko admin)
router.post('/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Nie można resetować własnego hasła
  if (req.user.id === userId) {
    return res.status(400).json({ error: 'Nie można resetować własnego hasła' });
  }
  
  // Generuj nowe hasło
  const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  db.run(
    `UPDATE users SET password_hash = ? WHERE id = ?`,
    [hashedPassword, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Błąd resetowania hasła' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
      }
      
      res.json({ 
        message: 'Hasło zresetowane', 
        newPassword: newPassword 
      });
    }
  );
});

// Pobierz statystyki według serii dla użytkownika
router.get('/series-stats', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  db.all(
    `SELECT 
      s.id,
      s.name,
      s.color,
      COUNT(DISTINCT e.id) as totalCount,
      COUNT(DISTINCT CASE WHEN up.completed = 1 THEN e.id END) as completedCount,
      SUM(CASE WHEN up.position > 0 THEN up.position ELSE 0 END) / 60 as totalTime,
      MAX(up.last_played) as lastPlayed
    FROM series s
    LEFT JOIN episodes e ON s.id = e.series_id
    LEFT JOIN user_progress up ON e.id = up.episode_id AND up.user_id = ?
    WHERE s.active = 1
    GROUP BY s.id
    ORDER BY s.name`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching series stats:', err);
        return res.status(500).json({ error: 'Failed to fetch series statistics' });
      }
      res.json(rows);
    }
  );
});

// Usuń użytkownika (tylko super admin)
router.delete('/:id', authenticateToken, (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Tylko super admin może usuwać użytkowników
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Tylko super administrator może usuwać użytkowników' });
  }
  
  // Nie można usunąć samego siebie
  if (req.user.id === userId) {
    return res.status(400).json({ error: 'Nie można usunąć własnego konta' });
  }
  
  // Sprawdź czy to nie jest ostatni super admin
  db.get(
    `SELECT COUNT(*) as count FROM users WHERE role = 'super_admin' AND id != ?`,
    [userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd sprawdzania administratorów' });
      }
      
      // Jeśli to jedyny super admin, nie pozwól usunąć
      if (result.count === 0) {
        db.get(
          `SELECT role FROM users WHERE id = ?`,
          [userId],
          (err, user) => {
            if (!err && user?.role === 'super_admin') {
              return res.status(400).json({ error: 'Nie można usunąć ostatniego super administratora' });
            }
            
            // Kontynuuj usuwanie
            deleteUser();
          }
        );
      } else {
        deleteUser();
      }
    }
  );
  
  function deleteUser() {
    db.serialize(() => {
      // Usuń powiązane dane
      db.run(`DELETE FROM user_progress WHERE user_id = ?`, [userId]);
      db.run(`DELETE FROM user_favorites WHERE user_id = ?`, [userId]);
      db.run(`DELETE FROM ratings WHERE user_id = ?`, [userId]);
      db.run(`DELETE FROM comments WHERE user_id = ?`, [userId]);
      db.run(`DELETE FROM password_resets WHERE user_id = ?`, [userId]);
      
      // Usuń użytkownika
      db.run(
        `DELETE FROM users WHERE id = ?`,
        [userId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Błąd usuwania użytkownika' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
          }
          
          res.json({ message: 'Użytkownik usunięty' });
        }
      );
    });
  }
});

export default router;