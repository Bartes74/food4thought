import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Pobierz statystyki według serii (musi być przed /:id)
router.get('/series-stats', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.user.id);
    
    const seriesStats = await db.all(`
      SELECT 
        s.id,
        s.name,
        s.color,
        COUNT(DISTINCT e.id) as totalCount,
        COUNT(DISTINCT CASE WHEN ls.completion_rate >= 0.9 THEN e.id END) as completedCount
      FROM series s
      LEFT JOIN episodes e ON s.id = e.series_id
      LEFT JOIN listening_sessions ls ON e.id = ls.episode_id AND ls.user_id = ?
      WHERE s.active = 1
      GROUP BY s.id, s.name, s.color
      HAVING totalCount > 0
      ORDER BY completedCount DESC, s.name
    `, [userId]);
    
    res.json(seriesStats);
  } catch (error) {
    console.error('Get series stats error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Aktualizuj preferencje użytkownika
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.user.id);
    const preferences = req.body;
    
    // Sprawdź czy użytkownik istnieje
    const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    // Walidacja preferencji
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Nieprawidłowe preferencje' });
    }
    
    // Zaktualizuj preferencje w bazie
    const preferencesJson = JSON.stringify(preferences);
    await db.run(
      'UPDATE users SET preferences = ? WHERE id = ?',
      [preferencesJson, userId]
    );
    
    res.json({ message: 'Preferencje zostały zaktualizowane' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz dane użytkownika
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.params.id);
    
    if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    
    const user = await db.get(
      'SELECT id, email, role FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz statystyki użytkownika
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.params.id);
    
    if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    
    // Pobierz statystyki z user_stats
    const userStats = await db.get(`
      SELECT 
        total_listening_time,
        total_episodes_completed,
        current_streak,
        longest_streak
      FROM user_stats 
      WHERE user_id = ?
    `, [userId]);
    
    // Pobierz podstawowe statystyki
    const stats = {
      totalListeningTime: userStats?.total_listening_time || 0, // w sekundach
      completedCount: userStats?.total_episodes_completed || 0,
      inProgressCount: 0,
      favoritesCount: 0,
      currentStreak: userStats?.current_streak || 0,
      longestStreak: userStats?.longest_streak || 0
    };
    
    // Liczba odcinków w trakcie (taka sama logika jak w /api/episodes/my)
    const inProgress = await db.get(`
      SELECT COUNT(DISTINCT episode_id) as count 
      FROM user_progress 
      WHERE user_id = ? AND completed = 0 AND position > 0
    `, [userId]);
    stats.inProgressCount = inProgress.count;
    
    // Liczba ulubionych odcinków
    const favorites = await db.get(`
      SELECT COUNT(*) as count 
      FROM user_favorites 
      WHERE user_id = ?
    `, [userId]);
    stats.favoritesCount = favorites.count;
    
    // Lista ukończonych odcinków
    const completedEpisodes = await db.all(`
      SELECT 
        e.id,
        e.title,
        e.date_added,
        s.name as series_name,
        s.color as series_color,
        ls.start_time,
        ls.duration_seconds as final_position
      FROM listening_sessions ls
      JOIN episodes e ON ls.episode_id = e.id
      JOIN series s ON e.series_id = s.id
      WHERE ls.user_id = ? AND ls.completion_rate >= 0.9
      GROUP BY e.id
      ORDER BY ls.start_time DESC
    `, [userId]);
    
    stats.completedEpisodes = completedEpisodes;
    
    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});



// Admin endpoints
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.all('SELECT id, email, role, created_at, email_verified FROM users ORDER BY id');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    
    const result = await db.run(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    res.json({ message: 'Rola zaktualizowana' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.params.id);
    
    // Sprawdź czy użytkownik nie próbuje usunąć samego siebie
    if (req.user.id === userId) {
      return res.status(400).json({ error: 'Nie możesz usunąć swojego własnego konta' });
    }
    
    // Sprawdź czy użytkownik istnieje
    const user = await db.get('SELECT role FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    // Sprawdź czy nie usuwa ostatniego super admina
    if (user.role === 'super_admin') {
      const superAdminCount = await db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['super_admin']);
      if (superAdminCount.count <= 1) {
        return res.status(400).json({ error: 'Nie można usunąć ostatniego super administratora' });
      }
    }
    
    // Usuń powiązane dane użytkownika za pomocą jednego zapytania SQL
    console.log(`Deleting user ${userId} data...`);
    
    try {
      // Usuń powiązane dane pojedynczo w odpowiedniej kolejności
      console.log('Deleting all related data...');
      
      // Najpierw usuń dane z tabel z foreign key constraints
      await db.run('DELETE FROM user_achievements WHERE user_id = ?', [userId]);
      await db.run('DELETE FROM user_stats WHERE user_id = ?', [userId]);
      await db.run('DELETE FROM listening_sessions WHERE user_id = ?', [userId]);
      await db.run('DELETE FROM user_progress WHERE user_id = ?', [userId]);
      await db.run('DELETE FROM user_favorites WHERE user_id = ?', [userId]);
      await db.run('DELETE FROM ratings WHERE user_id = ?', [userId]);
      await db.run('DELETE FROM comments WHERE user_id = ?', [userId]);
      await db.run('DELETE FROM password_resets WHERE user_id = ?', [userId]);
      
      console.log('All related data deleted successfully');
    } catch (deleteError) {
      console.error('Error deleting related data:', deleteError);
      console.error('Error message:', deleteError.message);
      console.error('Error code:', deleteError.code);
      throw deleteError;
    }
    
    // Na końcu usuń użytkownika
    console.log('Deleting user...');
    const result = await db.run('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    console.log('User deleted successfully');
    res.json({ message: 'Użytkownik usunięty' });
  } catch (error) {
    console.error('Delete user error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      stack: error.stack
    });
    res.status(500).json({ error: 'Błąd serwera', details: error.message });
  }
});



// Reset hasła użytkownika (admin only)
router.post('/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.params.id);
    
    // Sprawdź czy użytkownik istnieje
    const user = await db.get('SELECT email FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    // Generuj nowe hasło
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Zaktualizuj hasło
    await db.run(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    
    res.json({ 
      message: 'Hasło zostało zresetowane',
      newPassword: newPassword
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;