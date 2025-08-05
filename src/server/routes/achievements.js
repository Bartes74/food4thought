import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  getUserAchievements, 
  getUserStats, 
  recordListeningSession, 
  checkAndAwardAchievements,
  initializeUserStats 
} from '../utils/achievementTracker.js';
import db from '../database.js';

const router = express.Router();

// Pobierz osiągnięcia użytkownika
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Inicjalizuj statystyki użytkownika jeśli nie istnieją
    await initializeUserStats(userId);
    
    const achievements = await getUserAchievements(userId);
    const stats = await getUserStats(userId);
    
    res.json({
      achievements,
      stats
    });
  } catch (error) {
    console.error('Błąd podczas pobierania osiągnięć:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Zarejestruj sesję słuchania
router.post('/record-session', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { episodeId, startTime, endTime, playbackSpeed, completionRate, durationSeconds } = req.body;
    
    // Zarejestruj sesję
    await recordListeningSession(userId, episodeId, {
      startTime,
      endTime,
      playbackSpeed,
      completionRate,
      durationSeconds
    });
    
    // Sprawdź i przyznaj osiągnięcia
    const newAchievements = await checkAndAwardAchievements(userId);
    
    res.json({
      success: true,
      newAchievements
    });
  } catch (error) {
    console.error('Błąd podczas rejestrowania sesji:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz szczegółowe statystyki użytkownika
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await getUserStats(userId);
    
    res.json(stats);
  } catch (error) {
    console.error('Błąd podczas pobierania statystyk:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Leaderboard (tylko dla adminów)
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    
    const leaderboard = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          u.email,
          us.total_listening_time,
          us.total_episodes_completed,
          us.current_streak,
          us.longest_streak,
          COUNT(ua.achievement_id) as achievements_count
        FROM users u
        LEFT JOIN user_stats us ON u.id = us.user_id
        LEFT JOIN user_achievements ua ON u.id = ua.user_id AND ua.completed = 1
        GROUP BY u.id
        ORDER BY achievements_count DESC, us.total_listening_time DESC
        LIMIT 20
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Błąd podczas pobierania leaderboard:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Oznacz odcinek jako ukończony i zaktualizuj statystyki
router.post('/complete-episode', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { episodeId, completionRate, playbackSpeed } = req.body;
    
    // Pobierz aktualne statystyki
    const stats = await getUserStats(userId);
    
    const updates = {
      total_episodes_completed: (stats.total_episodes_completed || 0) + 1
    };
    
    // Sprawdź czy to perfect completion (95%+)
    if (completionRate >= 0.95) {
      updates.perfect_completions = (stats.perfect_completions || 0) + 1;
    }
    
    // Sprawdź wzorce czasowe
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 22 || hour < 6) {
      updates.night_owl_sessions = (stats.night_owl_sessions || 0) + 1;
    } else if (hour >= 6 && hour < 10) {
      updates.early_bird_sessions = (stats.early_bird_sessions || 0) + 1;
    }
    
    // Sprawdź prędkość słuchania
    if (playbackSpeed >= 2.0) {
      // Zakładamy, że odcinek trwał średnio 30 minut
      const estimatedDuration = 30 * 60; // 30 minut w sekundach
      updates.high_speed_listening_time = (stats.high_speed_listening_time || 0) + estimatedDuration;
    }
    
    // Zaktualizuj statystyki
    await updateUserStats(userId, updates);
    
    // Sprawdź i przyznaj osiągnięcia
    const newAchievements = await checkAndAwardAchievements(userId);
    
    res.json({
      success: true,
      newAchievements
    });
  } catch (error) {
    console.error('Błąd podczas ukończenia odcinka:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router; 