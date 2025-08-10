import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Pobierz statystyki admina
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    
    // Sprawdź czy użytkownik jest adminem
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    
    const stats = {
      totalUsers: 0,
      totalSeries: 0,
      totalEpisodes: 0
    };
    
    // Pobierz statystyki
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    const seriesCount = await db.get('SELECT COUNT(*) as count FROM series');
    const episodeCount = await db.get('SELECT COUNT(*) as count FROM episodes');
    
    stats.totalUsers = userCount.count;
    stats.totalSeries = seriesCount.count;
    stats.totalEpisodes = episodeCount.count;
    
    res.json(stats);
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;

