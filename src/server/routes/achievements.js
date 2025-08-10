import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Pobierz wszystkie osiągnięcia z postępem użytkownika
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.user.id);
    
    // Pobierz wszystkie osiągnięcia
    const achievements = await db.all('SELECT * FROM achievements ORDER BY points DESC');
    
    // Pobierz postęp użytkownika dla każdego osiągnięcia
    const userProgress = await db.all(`
      SELECT achievement_id, progress_value, completed
      FROM user_achievements 
      WHERE user_id = ?
    `, [userId]);
    
    // Połącz osiągnięcia z postępem użytkownika
    const achievementsWithProgress = achievements.map(achievement => {
      const progress = userProgress.find(p => p.achievement_id === achievement.id);
      return {
        ...achievement,
        progress_value: progress ? progress.progress_value : 0,
        completed: progress ? progress.completed : 0
      };
    });
    
    res.json(achievementsWithProgress);
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;

