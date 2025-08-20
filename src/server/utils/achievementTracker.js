import { getDb } from '../database.js';

// Inicjalizacja statystyk użytkownika
export const initializeUserStats = async (userId) => {
  return new Promise((resolve, reject) => {
    getDb().run(`
      INSERT OR IGNORE INTO user_stats (user_id)
      VALUES (?)
    `, [userId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Aktualizacja statystyk użytkownika
export const updateUserStats = async (userId, updates) => {
  try {
    const db = await getDb();
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(updates);
    values.push(userId);

    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE user_stats 
        SET ${setClause}, last_updated = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, values, function(err) {
        if (err) {
          console.error('Error updating user stats:', err);
          reject(err);
        } else {
          console.log(`Updated user ${userId} stats:`, updates);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error in updateUserStats:', error);
    throw error;
  }
};

// Zapisanie sesji słuchania
export const recordListeningSession = async (userId, episodeId, sessionData) => {
  const { startTime, endTime, playbackSpeed, completionRate, durationSeconds } = sessionData;
  
  return new Promise((resolve, reject) => {
    getDb().run(`
      INSERT INTO listening_sessions 
      (user_id, episode_id, start_time, end_time, playback_speed, completion_rate, duration_seconds)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, episodeId, startTime, endTime, playbackSpeed, completionRate, durationSeconds], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Sprawdzenie i przyznanie osiągnięć
export const checkAndAwardAchievements = async (userId) => {
  try {
    const db = await getDb();
    
    // Pobierz aktualne statystyki użytkownika
    const stats = await getUserStats(userId);
    
    // Pobierz wszystkie osiągnięcia
    const achievements = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM achievements', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Sprawdź strukturę tabeli user_achievements (zgodność wsteczna)
    const uaCols = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(user_achievements)", [], (err, rows) => {
        if (err) reject(err); else resolve(rows || []);
      });
    });
    const hasUaProgress = uaCols.some(c => c.name === 'progress_value') && uaCols.some(c => c.name === 'completed');

    // Pobierz już przyznane osiągnięcia
    const earnedAchievements = await new Promise((resolve, reject) => {
      const query = hasUaProgress
        ? 'SELECT achievement_id FROM user_achievements WHERE user_id = ? AND completed = 1'
        : 'SELECT achievement_id FROM user_achievements WHERE user_id = ?';
      db.all(query, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.achievement_id));
      });
    });

    const newAchievements = [];

    for (const achievement of achievements) {
      if (earnedAchievements.includes(achievement.id)) continue;

      let progress = 0;
      let completed = false;

      switch (achievement.requirement_type) {
        case 'high_speed_time':
          progress = stats.high_speed_listening_time || 0;
          completed = progress >= achievement.requirement_value;
          break;
        case 'perfect_completion':
          progress = stats.perfect_completions || 0;
          completed = progress >= achievement.requirement_value;
          break;
        case 'perfect_completions':
          progress = stats.perfect_completions || 0;
          completed = progress >= achievement.requirement_value;
          break;
        case 'night_owl_sessions':
          progress = stats.night_owl_sessions || 0;
          completed = progress >= achievement.requirement_value;
          break;
        case 'early_bird_sessions':
          progress = stats.early_bird_sessions || 0;
          completed = progress >= achievement.requirement_value;
          break;
        case 'streak_days':
          progress = stats.current_streak || 0;
          completed = progress >= achievement.requirement_value;
          break;
        case 'daily_episodes':
          progress = stats.daily_episodes_count || 0;
          completed = progress >= achievement.requirement_value;
          break;
        case 'episodes_completed':
          progress = stats.total_episodes_completed || 0;
          completed = progress >= achievement.requirement_value;
          break;
        case 'total_listening_time':
          progress = stats.total_listening_time || 0;
          completed = progress >= achievement.requirement_value;
          break;
      }

      if (completed) {
        if (hasUaProgress) {
          await new Promise((resolve, reject) => {
            db.run(`
              INSERT OR REPLACE INTO user_achievements 
              (user_id, achievement_id, earned_at, progress_value, completed)
              VALUES (?, ?, CURRENT_TIMESTAMP, ?, 1)
            `, [userId, achievement.id, progress], function(err) {
              if (err) reject(err); else resolve();
            });
          });
        } else {
          await new Promise((resolve, reject) => {
            db.run(`
              INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, earned_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)
            `, [userId, achievement.id], function(err) {
              if (err) reject(err); else resolve();
            });
          });
        }
        newAchievements.push(achievement);
      } else if (hasUaProgress) {
        // Aktualizuj postęp (tylko jeśli kolumny istnieją)
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT OR REPLACE INTO user_achievements 
            (user_id, achievement_id, progress_value, completed)
            VALUES (?, ?, ?, 0)
          `, [userId, achievement.id, progress], function(err) {
            if (err) reject(err); else resolve();
          });
        });
      }
    }

    return newAchievements;
  } catch (error) {
    console.error('Błąd podczas sprawdzania osiągnięć:', error);
    return [];
  }
};

// Pobranie osiągnięć użytkownika
export const getUserAchievements = (userId) => {
  return new Promise((resolve, reject) => {
    getDb().all(`
      SELECT 
        a.id,
        a.name,
        a.description,
        a.icon,
        a.points,
        a.requirement_type,
        a.requirement_value,
        a.category,
        a.is_hidden,
        COALESCE(ua.completed, 0) as completed,
        ua.completed_at,
        COALESCE(ua.progress, 0) as progress,
        a.requirement_value as target
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      WHERE a.is_hidden = 0 OR ua.completed = 1
      ORDER BY a.id
    `, [userId], (err, rows) => {
      if (err) {
        console.error('Error fetching user achievements:', err);
        reject(err);
      } else {
        // Ensure all required fields are present
        const achievements = (rows || []).map(ach => ({
          id: ach.id,
          name: ach.name || 'Nieznane osiągnięcie',
          description: ach.description || '',
          icon: ach.icon || 'trophy',
          points: ach.points || 0,
          completed: !!ach.completed,
          completedAt: ach.completed_at || null,
          progress: ach.progress || 0,
          target: ach.target || 1,
          category: ach.category || 'general',
          requirementType: ach.requirement_type,
          isHidden: ach.is_hidden === 1
        }));
        
        resolve(achievements);
      }
    });
  });
};

// Pobranie statystyk użytkownika
export const getUserStats = async (userId) => {
  try {
    const db = await getDb();
    // 1) Bazowe pola z user_stats (z mapowaniem starych nazw kolumn)
    const row = await db.get(`SELECT * FROM user_stats WHERE user_id = ?`, [userId]);
    const baseStats = {
      user_id: userId,
      total_listening_time: (row?.total_listening_time ?? row?.total_listening_seconds) || 0,
      total_episodes_completed: (row?.total_episodes_completed ?? row?.episodes_completed) || 0,
      current_streak: row?.current_streak || 0,
      longest_streak: row?.longest_streak || 0,
      last_listening_date: row?.last_listening_date || row?.last_active || null,
      avg_completion: row?.avg_completion || 0,
      favorite_category: row?.favorite_category || null,
      last_updated: row?.last_updated || row?.updated_at || new Date().toISOString()
    };

    // 2) Punkty i liczba osiągnięć
    const totals = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = ? AND ua.completed = 1) as total_achievements,
        (SELECT COALESCE(SUM(a.points), 0) FROM user_achievements ua 
         JOIN achievements a ON ua.achievement_id = a.id 
         WHERE ua.user_id = ? AND ua.completed = 1) as total_points
    `, [userId, userId]);

    // 3) Metryki potrzebne do progresu osiągnięć – licz z listening_sessions
    const aggregates = await db.get(`
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
        AND (
          CAST(strftime('%H', start_time) AS INTEGER) >= 22
          OR CAST(strftime('%H', start_time) AS INTEGER) < 6
        )
    `, [userId]);

    const earlyBird = await db.get(`
      SELECT COALESCE(COUNT(*), 0) AS cnt
      FROM listening_sessions
      WHERE user_id = ?
        AND CAST(strftime('%H', start_time) AS INTEGER) BETWEEN 6 AND 9
    `, [userId]);

    const maxDaily = await db.get(`
      SELECT COALESCE(MAX(cnt), 0) AS max_count FROM (
        SELECT date(start_time) AS day, COUNT(DISTINCT episode_id) AS cnt
        FROM listening_sessions
        WHERE user_id = ?
        GROUP BY day
      )
    `, [userId]);

    // 4) Bieżąca seria dni (current_streak) obliczana z distinct days
    const days = await db.all(`
      SELECT date(start_time) AS day
      FROM listening_sessions
      WHERE user_id = ?
      GROUP BY day
      ORDER BY day DESC
    `, [userId]);

    let computedCurrentStreak = 0;
    if (days.length > 0) {
      const today = new Date();
      let cursor = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      // Normalizuj do YYYY-MM-DD
      const toKey = (d) => d.toISOString().split('T')[0];
      const set = new Set(days.map(d => d.day));
      // Jeżeli nie było aktywności dziś, zacznij od wczoraj
      if (!set.has(toKey(cursor))) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
      while (set.has(toKey(cursor))) {
        computedCurrentStreak += 1;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
    }

    return {
      ...baseStats,
      total_achievements: totals?.total_achievements || 0,
      total_points: totals?.total_points || 0,
      high_speed_listening_time: Number(aggregates?.high_speed_listening_time) || 0,
      perfect_completions: Number(aggregates?.perfect_completions) || 0,
      night_owl_sessions: Number(nightOwl?.cnt) || 0,
      early_bird_sessions: Number(earlyBird?.cnt) || 0,
      daily_episodes_count: Number(maxDaily?.max_count) || 0,
      // Nadpisz obliczoną serią, jeśli większa
      current_streak: Math.max(baseStats.current_streak || 0, computedCurrentStreak)
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    throw error;
  }
}; 