import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { updateUserStats, checkAndAwardAchievements } from '../utils/achievementTracker.js';

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
      SELECT achievement_id, progress_value, completed, earned_at
      FROM user_achievements 
      WHERE user_id = ?
    `, [userId]);
    
    // Pobierz statystyki użytkownika
    const userStats = await db.get(`
      SELECT total_listening_time, total_episodes_completed, current_streak, longest_streak
      FROM user_stats 
      WHERE user_id = ?
    `, [userId]);
    
    // Połącz osiągnięcia z postępem użytkownika
    const achievementsWithProgress = achievements.map(achievement => {
      const progress = userProgress.find(p => p.achievement_id === achievement.id);
      return {
        ...achievement,
        progress_value: progress ? progress.progress_value : 0,
        completed: progress ? progress.completed : 0,
        earned_at: progress ? progress.earned_at : null
      };
    });
    
    res.json({
      achievements: achievementsWithProgress,
      stats: userStats || {
        total_listening_time: 0,
        total_episodes_completed: 0,
        current_streak: 0,
        longest_streak: 0
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Zapisz sesję słuchania i zaktualizuj statystyki
router.post('/record-session', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.user.id);
    const { episodeId, startTime, endTime, playbackSpeed, completionRate, durationSeconds } = req.body;
    
    // Sprawdź czy odcinek istnieje
    const episode = await db.get('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }
    
    // Zapisz sesję słuchania
    await db.run(`
      INSERT INTO listening_sessions 
      (user_id, episode_id, start_time, end_time, playback_speed, completion_rate, duration_seconds)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, episodeId, startTime, endTime, playbackSpeed, completionRate, durationSeconds]);
    
    // Pobierz aktualne statystyki użytkownika
    const currentStats = await db.get('SELECT * FROM user_stats WHERE user_id = ?', [userId]);
    
    // Oblicz nowe statystyki
    const updates = {};
    
    // Całkowity czas słuchania
    updates.total_listening_time = (currentStats?.total_listening_time || 0) + durationSeconds;
    
    // Liczba ukończonych odcinków (completion_rate >= 0.9)
    if (completionRate >= 0.9) {
      updates.total_episodes_completed = (currentStats?.total_episodes_completed || 0) + 1;
    }
    
    // Liczba rozpoczętych odcinków
    updates.total_episodes_started = (currentStats?.total_episodes_started || 0) + 1;
    
    // Średnia dokładność ukończenia
    const totalCompleted = updates.total_episodes_completed || currentStats?.total_episodes_completed || 0;
    const currentAvg = currentStats?.average_completion_rate || 0;
    if (completionRate >= 0.9) {
      updates.average_completion_rate = ((currentAvg * (totalCompleted - 1)) + completionRate) / totalCompleted;
    }
    
    // Zaktualizuj statystyki użytkownika
    await updateUserStats(userId, updates);
    
    // Sprawdź i przyznaj osiągnięcia
    const newAchievements = await checkAndAwardAchievements(userId);
    
    res.json({ 
      message: 'Sesja zapisana',
      newAchievements: newAchievements.length > 0 ? newAchievements.map(a => a.name) : []
    });
  } catch (error) {
    console.error('Record session error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Endpoint do przeliczenia statystyk i osiągnięć na podstawie istniejących sesji
router.post('/recalculate-stats', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.user.id);
    
    console.log(`Przeliczanie statystyk dla użytkownika ${userId}...`);
    
    // Pobierz wszystkie sesje słuchania użytkownika
    const sessions = await db.all(`
      SELECT episode_id, duration_seconds, completion_rate, playback_speed, start_time
      FROM listening_sessions 
      WHERE user_id = ?
      ORDER BY start_time
    `, [userId]);
    
    console.log(`Znaleziono ${sessions.length} sesji słuchania`);
    
    // Oblicz statystyki
    let totalListeningTime = 0;
    let totalEpisodesCompleted = 0;
    let totalEpisodesStarted = 0;
    let highSpeedListeningTime = 0;
    let perfectCompletions = 0;
    let totalCompletionRate = 0;
    let completedCount = 0;
    
    // Mapowanie odcinków do dat (dla obliczenia serii)
    const episodeDates = new Set();
    
    sessions.forEach(session => {
      totalListeningTime += session.duration_seconds || 0;
      totalEpisodesStarted += 1;
      
      // Data sesji
      const sessionDate = new Date(session.start_time).toISOString().split('T')[0];
      episodeDates.add(sessionDate);
      
      // Ukończone odcinki (completion_rate >= 0.9)
      if (session.completion_rate >= 0.9) {
        totalEpisodesCompleted += 1;
        totalCompletionRate += session.completion_rate;
        completedCount += 1;
      }
      
      // Słuchanie z wysoką prędkością (>= 1.5x)
      if (session.playback_speed >= 1.5) {
        highSpeedListeningTime += session.duration_seconds || 0;
      }
      
      // Idealne ukończenie (completion_rate >= 0.95)
      if (session.completion_rate >= 0.95) {
        perfectCompletions += 1;
      }
    });
    
    // Oblicz średnią dokładność
    const averageCompletionRate = completedCount > 0 ? totalCompletionRate / completedCount : 0;
    
    // Oblicz serię (uproszczone - liczba dni z aktywnością)
    const currentStreak = episodeDates.size;
    
    // Zaktualizuj statystyki użytkownika
    const updates = {
      total_listening_time: totalListeningTime,
      total_episodes_completed: totalEpisodesCompleted,
      total_episodes_started: totalEpisodesStarted,
      current_streak: currentStreak,
      longest_streak: Math.max(currentStreak, 0),
      average_completion_rate: averageCompletionRate,
      high_speed_listening_time: highSpeedListeningTime,
      perfect_completions: perfectCompletions
    };
    
    console.log('Aktualizowane statystyki:', updates);
    
    await updateUserStats(userId, updates);
    
    // Sprawdź i przyznaj osiągnięcia
    const newAchievements = await checkAndAwardAchievements(userId);
    
    console.log(`Przyznano ${newAchievements.length} nowych osiągnięć:`, newAchievements.map(a => a.name));
    
    res.json({ 
      message: 'Statystyki przeliczone',
      stats: updates,
      newAchievements: newAchievements.map(a => a.name)
    });
  } catch (error) {
    console.error('Recalculate stats error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;

