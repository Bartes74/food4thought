import express from 'express';
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
    
    // Pobierz podstawowe statystyki
    const stats = {
      totalListeningTime: 0,
      completedCount: 0,
      inProgressCount: 0,
      favoritesCount: 0
    };
    
    // Całkowity czas słuchania (suma pozycji z ukończonych odcinków)
    const listeningTime = await db.get(`
      SELECT COALESCE(SUM(position), 0) as total_time 
      FROM user_progress 
      WHERE user_id = ? AND completed = 1
    `, [userId]);
    stats.totalListeningTime = Math.round(listeningTime.total_time / 60); // w minutach
    
    // Liczba ukończonych odcinków
    const completed = await db.get(`
      SELECT COUNT(DISTINCT episode_id) as count 
      FROM user_progress 
      WHERE user_id = ? AND completed = 1
    `, [userId]);
    stats.completedCount = completed.count;
    
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
    
    const result = await db.run(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    res.json({ message: 'Użytkownik usunięty' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;