import db from '../database.js';

// Inicjalizacja statystyk użytkownika
export const initializeUserStats = async (userId) => {
  return new Promise((resolve, reject) => {
    db.run(`
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
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Zapisanie sesji słuchania
export const recordListeningSession = async (userId, episodeId, sessionData) => {
  const { startTime, endTime, playbackSpeed, completionRate, durationSeconds } = sessionData;
  
  return new Promise((resolve, reject) => {
    db.run(`
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
    // Pobierz aktualne statystyki użytkownika
    const stats = await getUserStats(userId);
    
    // Pobierz wszystkie osiągnięcia
    const achievements = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM achievements', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Pobierz już przyznane osiągnięcia
    const earnedAchievements = await new Promise((resolve, reject) => {
      db.all('SELECT achievement_id FROM user_achievements WHERE user_id = ? AND completed = 1', [userId], (err, rows) => {
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
        case 'high_speed_listening_time':
          progress = stats.high_speed_listening_time || 0;
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
        case 'current_streak':
          progress = stats.current_streak || 0;
          completed = progress >= achievement.requirement_value;
          break;
        case 'daily_episodes_count':
          progress = stats.daily_episodes_count || 0;
          completed = progress >= achievement.requirement_value;
          break;
      }

      if (completed) {
        // Przyznaj osiągnięcie
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT OR REPLACE INTO user_achievements 
            (user_id, achievement_id, earned_at, progress_value, completed)
            VALUES (?, ?, CURRENT_TIMESTAMP, ?, 1)
          `, [userId, achievement.id, progress], function(err) {
            if (err) reject(err);
            else resolve();
          });
        });

        newAchievements.push(achievement);
      } else {
        // Zaktualizuj postęp
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT OR REPLACE INTO user_achievements 
            (user_id, achievement_id, progress_value, completed)
            VALUES (?, ?, ?, 0)
          `, [userId, achievement.id, progress], function(err) {
            if (err) reject(err);
            else resolve();
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
export const getUserAchievements = async (userId) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        a.*,
        ua.earned_at,
        ua.progress_value,
        ua.completed
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      ORDER BY a.category, a.id
    `, [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Pobranie statystyk użytkownika
export const getUserStats = async (userId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM user_stats WHERE user_id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row || {});
    });
  });
}; 