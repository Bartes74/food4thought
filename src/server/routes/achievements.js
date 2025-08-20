import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getDb } from '../database.js';
import { updateUserStats, checkAndAwardAchievements } from '../utils/achievementTracker.js';

const router = express.Router();

// Pobierz wszystkie osiągnięcia z postępem użytkownika
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.user.id);

    // Sprawdź strukturę tabel (zgodność wsteczna)
    const achCols = await db.all("PRAGMA table_info(achievements)");
    const uaCols = await db.all("PRAGMA table_info(user_achievements)");

    const has = (cols, name) => cols.some(c => c.name === name);
    const hasReqFields = has(achCols, 'requirement_type') && has(achCols, 'requirement_value');
    const hasUaProgress = has(uaCols, 'progress_value') && has(uaCols, 'completed');

    // Pobierz osiągnięcia i znormalizuj pola requirement_* oraz category/is_hidden
    const rawAchievements = await db.all('SELECT * FROM achievements ORDER BY points DESC');
    const achievements = rawAchievements.map(a => {
      if (hasReqFields) {
        return {
          ...a,
          category: a.category || 'general',
          is_hidden: a.is_hidden || 0
        };
      }
      // Stara struktura z `criteria`: type:value
      const [reqType, reqVal] = (a.criteria || '').split(':');
      return {
        ...a,
        requirement_type: reqType || 'unknown',
        requirement_value: Number(reqVal) || 0,
        category: 'general',
        is_hidden: 0
      };
    });

    // Pobierz postęp użytkownika (z obsługą starszej struktury)
    let userProgress = [];
    if (hasUaProgress) {
      userProgress = await db.all(
        `SELECT achievement_id, progress_value, completed, earned_at FROM user_achievements WHERE user_id = ?`,
        [userId]
      );
    } else {
      const earned = await db.all(
        `SELECT achievement_id, earned_at FROM user_achievements WHERE user_id = ?`,
        [userId]
      );
      userProgress = earned.map(r => ({
        achievement_id: r.achievement_id,
        progress_value: 0,
        completed: 1,
        earned_at: r.earned_at
      }));
    }

    // Zawsze wylicz progres na żywo (fallback) i uzupełnij brakujące dane progresu
    const liveStats = await db.get(`
      SELECT 
        COALESCE(SUM(CASE WHEN playback_speed >= 1.5 THEN duration_seconds ELSE 0 END), 0) AS high_speed_listening_time,
        COALESCE(SUM(CASE WHEN completion_rate >= 0.95 THEN 1 ELSE 0 END), 0) AS perfect_completions
      FROM listening_sessions
      WHERE user_id = ?
    `, [userId]);

    const nightOwl = await db.get(`
      SELECT COALESCE(COUNT(*), 0) AS cnt
      FROM listening_sessions
      WHERE user_id = ?
        AND (CAST(strftime('%H', start_time) AS INTEGER) >= 22 OR CAST(strftime('%H', start_time) AS INTEGER) < 6)
    `, [userId]);

    const earlyBird = await db.get(`
      SELECT COALESCE(COUNT(*), 0) AS cnt
      FROM listening_sessions
      WHERE user_id = ? AND CAST(strftime('%H', start_time) AS INTEGER) BETWEEN 6 AND 9
    `, [userId]);

    const maxDaily = await db.get(`
      SELECT COALESCE(MAX(cnt), 0) AS max_count FROM (
        SELECT date(start_time) AS day, COUNT(DISTINCT episode_id) AS cnt
        FROM listening_sessions
        WHERE user_id = ?
        GROUP BY day
      )
    `, [userId]);

    const episodesCompleted = await db.get(`
      SELECT COALESCE(COUNT(DISTINCT CASE WHEN completion_rate >= 0.9 THEN episode_id END), 0) AS cnt
      FROM listening_sessions WHERE user_id = ?
    `, [userId]);

    const progressMap = {
      high_speed_time: Number(liveStats?.high_speed_listening_time) || 0,
      high_speed_listening_time: Number(liveStats?.high_speed_listening_time) || 0,
      perfect_completion: Number(liveStats?.perfect_completions) || 0,
      perfect_completions: Number(liveStats?.perfect_completions) || 0,
      night_owl_sessions: Number(nightOwl?.cnt) || 0,
      early_bird_sessions: Number(earlyBird?.cnt) || 0,
      daily_episodes: Number(maxDaily?.max_count) || 0,
      daily_episodes_count: Number(maxDaily?.max_count) || 0,
      episodes_completed: Number(episodesCompleted?.cnt) || 0,
      current_streak: 0
    };

    // Oblicz current_streak live (dni z aktywnością)
    const days = await db.all(`
      SELECT date(start_time) AS day
      FROM listening_sessions
      WHERE user_id = ?
      GROUP BY day
      ORDER BY day DESC
    `, [userId]);
    if (days.length > 0) {
      const today = new Date();
      let cursor = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      const toKey = (d) => d.toISOString().split('T')[0];
      const set = new Set(days.map(d => d.day));
      if (!set.has(toKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
      while (set.has(toKey(cursor))) { progressMap.current_streak += 1; cursor.setUTCDate(cursor.getUTCDate() - 1); }
    }

    // Uzupełnij/uzgodnij userProgress o live-progress
    const progressById = new Map(userProgress.map(p => [p.achievement_id, p]));
    achievements.forEach(a => {
      const reqType = a.requirement_type;
      const pv = progressMap[reqType] ?? 0;
      const entry = progressById.get(a.id);
      const target = a.requirement_value || 0;
      const isCompleted = pv >= target ? 1 : 0;
      if (!entry) {
        userProgress.push({ achievement_id: a.id, progress_value: pv, completed: isCompleted, earned_at: null });
      } else {
        // Zawsze bierz maksymalny znany progres oraz OR dla completed,
        // aby stare zerowe wpisy nie nadpisywały postępu liczonego na żywo
        const storedProgress = Number(entry.progress_value ?? 0);
        const storedCompleted = Number(entry.completed ?? 0) === 1 ? 1 : 0;
        entry.progress_value = Math.max(storedProgress, pv);
        entry.completed = storedCompleted || isCompleted ? 1 : 0;
      }
    });

    // Pobierz statystyki użytkownika i zmapuj nazwy pól do oczekiwanych kluczy
    const us = await db.get(`SELECT * FROM user_stats WHERE user_id = ?`, [userId]);
    const userStats = {
      total_listening_time: (us?.total_listening_time ?? us?.total_listening_seconds) || 0,
      total_episodes_completed: (us?.total_episodes_completed ?? us?.episodes_completed) || 0,
      current_streak: us?.current_streak || 0,
      longest_streak: us?.longest_streak || 0,
      avg_completion: us?.avg_completion || 0
    };

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
      stats: userStats
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
      // Sprawdź czy ten odcinek już był ukończony
      const existingCompleted = await db.get(`
        SELECT COUNT(*) as count 
        FROM listening_sessions 
        WHERE user_id = ? AND episode_id = ? AND completion_rate >= 0.9
      `, [userId, episodeId]);
      
      // Jeśli to pierwsze ukończenie tego odcinka, zwiększ licznik
      if (existingCompleted.count === 0) {
        updates.total_episodes_completed = (currentStats?.total_episodes_completed || 0) + 1;
      } else {
        updates.total_episodes_completed = currentStats?.total_episodes_completed || 0;
      }
    } else {
      updates.total_episodes_completed = currentStats?.total_episodes_completed || 0;
    }
    
    // Średnia dokładność ukończenia
    const totalCompleted = updates.total_episodes_completed || currentStats?.total_episodes_completed || 0;
    const currentAvg = currentStats?.avg_completion || 0;
    if (completionRate >= 0.9) {
      updates.avg_completion = ((currentAvg * (totalCompleted - 1)) + completionRate) / totalCompleted;
    }
    
    // Zaktualizuj statystyki użytkownika
    await updateUserStats(userId, updates);
    
    // Sprawdź i przyznaj osiągnięcia
    const newAchievements = await checkAndAwardAchievements(userId);
    
    res.json({ 
      message: 'Sesja zapisana',
      newAchievements: newAchievements.map(a => a.name)
    });
  } catch (error) {
    console.error('Record session error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Endpoint do przeliczenia statystyk (tylko dla adminów)
router.post('/recalculate-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.body.userId) || parseInt(req.user.id);
    
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
    let highSpeedListeningTime = 0;
    let perfectCompletions = 0;
    let totalCompletionRate = 0;
    let completedCount = 0;
    
    // Mapowanie odcinków do dat (dla obliczenia serii)
    const episodeDates = new Set();
    
    sessions.forEach(session => {
      totalListeningTime += session.duration_seconds || 0;
      
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
      current_streak: currentStreak,
      longest_streak: Math.max(currentStreak, 0),
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

