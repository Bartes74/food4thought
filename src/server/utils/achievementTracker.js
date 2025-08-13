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
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          us.*,
          (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = ? AND ua.completed = 1) as total_achievements,
          (SELECT COALESCE(SUM(a.points), 0) FROM user_achievements ua 
           JOIN achievements a ON ua.achievement_id = a.id 
           WHERE ua.user_id = ? AND ua.completed = 1) as total_points
        FROM user_stats us 
        WHERE user_id = ?
      `, [userId, userId, userId], (err, row) => {
      if (err) {
        console.error('Error fetching user stats:', err);
        reject(err);
      } else {
        // Ensure all required fields are present with default values
        const defaultStats = {
          user_id: userId,
          total_listening_time: 0,
          total_episodes_completed: 0,
          current_streak: 0,
          longest_streak: 0,
          last_listening_date: null,
          total_achievements: 0,
          total_points: 0,
          average_completion_rate: 0,
          favorite_category: null,
          last_updated: new Date().toISOString()
        };
        
        // Merge with database row if exists
        const stats = row ? { ...defaultStats, ...row } : defaultStats;
        
        // Ensure numeric fields are numbers
        const numericFields = [
          'total_listening_time', 'total_episodes_completed', 'current_streak', 'longest_streak',
          'total_achievements', 'total_points', 'average_completion_rate'
        ];
        
        numericFields.forEach(field => {
          stats[field] = Number(stats[field]) || 0;
        });
        
        resolve(stats);
      }
    });
  });
  } catch (error) {
    console.error('Error in getUserStats:', error);
    throw error;
  }
}; 