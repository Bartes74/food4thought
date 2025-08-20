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
    
    const { range = 'all' } = req.query;
    
    // Funkcja do generowania warunku daty na podstawie range
    const getDateCondition = (range) => {
      const now = new Date();
      switch (range) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return `AND created_at >= '${today.toISOString()}'`;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return `AND created_at >= '${weekAgo.toISOString()}'`;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return `AND created_at >= '${monthAgo.toISOString()}'`;
        default:
          return '';
      }
    };
    
    const dateCondition = getDateCondition(range);
    
    // Statystyki użytkowników
    const userStats = {
      total: 0,
      active: 0,
      new: 0,
      retention: 0
    };
    
    // Całkowita liczba użytkowników
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    userStats.total = totalUsers.count;
    
    // Nowi użytkownicy w wybranym okresie
    if (range !== 'all') {
      const newUsers = await db.get(`SELECT COUNT(*) as count FROM users WHERE 1=1 ${dateCondition}`);
      userStats.new = newUsers.count;
    } else {
      userStats.new = totalUsers.count;
    }
    
    // Aktywni użytkownicy (którzy mają jakąś aktywność)
    const activeUsers = await db.get(`
      SELECT COUNT(DISTINCT u.id) as count 
      FROM users u 
      LEFT JOIN user_progress up ON u.id = up.user_id 
      WHERE up.user_id IS NOT NULL
    `);
    userStats.active = activeUsers.count;
    
    // Retencja (uproszczona - procent użytkowników z aktywnością)
    userStats.retention = userStats.total > 0 ? Math.round((userStats.active / userStats.total) * 100) : 0;
    
    // Statystyki odcinków
    const episodeStats = {
      total: 0,
      averageRating: 0,
      completionRate: 0,
      averageCompletionTime: 0
    };
    
    // Całkowita liczba odcinków
    const totalEpisodes = await db.get('SELECT COUNT(*) as count FROM episodes');
    episodeStats.total = totalEpisodes.count;
    
    // Średnia ocena
    const avgRating = await db.get('SELECT AVG(rating) as avg FROM ratings');
    episodeStats.averageRating = avgRating.avg ? Math.round(avgRating.avg * 10) / 10 : 0;
    
    // Procent ukończenia (uproszczony)
    const totalProgress = await db.get('SELECT COUNT(*) as count FROM user_progress WHERE completed = 1');
    const totalProgressAttempts = await db.get('SELECT COUNT(*) as count FROM user_progress');
    episodeStats.completionRate = totalProgressAttempts.count > 0 ? Math.round((totalProgress.count / totalProgressAttempts.count) * 100) : 0;
    
    // Średni czas ukończenia (w minutach)
    const avgCompletionTime = await db.get(`
      SELECT AVG(position) as avg_time 
      FROM user_progress 
      WHERE completed = 1 AND position > 0
    `);
    episodeStats.averageCompletionTime = avgCompletionTime.avg_time ? Math.round(avgCompletionTime.avg_time / 60) : 0;
    
    // Statystyki serii
    const seriesStats = {
      total: 0,
      active: 0,
      averageCompletion: 0
    };
    
    // Całkowita liczba serii
    const totalSeries = await db.get('SELECT COUNT(*) as count FROM series');
    seriesStats.total = totalSeries.count;
    
    // Aktywne serie (z odcinkami)
    const activeSeries = await db.get(`
      SELECT COUNT(DISTINCT s.id) as count 
      FROM series s 
      LEFT JOIN episodes e ON s.id = e.series_id 
      WHERE e.id IS NOT NULL
    `);
    seriesStats.active = activeSeries.count;
    
    // Średni procent ukończenia serii
    const seriesCompletion = await db.get(`
      SELECT AVG(completion_percentage) as avg_completion 
      FROM (
        SELECT s.id, 
               (COUNT(CASE WHEN up.completed = 1 THEN 1 END) * 100.0 / COUNT(e.id)) as completion_percentage
        FROM series s
        LEFT JOIN episodes e ON s.id = e.series_id
        LEFT JOIN user_progress up ON e.id = up.episode_id
        GROUP BY s.id
        HAVING COUNT(e.id) > 0
      )
    `);
    seriesStats.averageCompletion = seriesCompletion.avg_completion ? Math.round(seriesCompletion.avg_completion) : 0;
    
    // Statystyki techniczne
    const technicalStats = {
      languages: [
        { language: 'Polski', percentage: 70 },
        { language: 'English', percentage: 20 },
        { language: 'Français', percentage: 10 }
      ],
      playbackSpeeds: [
        { speed: '1.0x', percentage: 45 },
        { speed: '1.25x', percentage: 30 },
        { speed: '1.5x', percentage: 15 },
        { speed: '2.0x', percentage: 10 }
      ],
      hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({ 
        hour, 
        activity: Math.floor(Math.random() * 50) 
      }))
    };
    
    const stats = {
      users: userStats,
      episodes: episodeStats,
      series: seriesStats,
      technical: technicalStats,
      generatedAt: new Date().toISOString(),
      timeRange: range
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz aktywność użytkowników (admin only)
router.get('/users/activity', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    
    // Sprawdź czy użytkownik jest adminem
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    
    const { limit = 50 } = req.query;
    
    // Pobierz aktywność użytkowników
    const userActivity = await db.all(`
      SELECT 
        u.id as userId,
        u.email,
        u.role,
        u.created_at as joinedAt,
        us.total_listening_time,
        us.total_episodes_completed,
        us.current_streak,
        us.longest_streak,
        us.avg_completion,
        us.last_active,
        (
          SELECT COUNT(*) 
          FROM user_achievements ua 
          WHERE ua.user_id = u.id AND ua.completed = 1
        ) as achievements_earned,
        (
          SELECT COUNT(*) 
          FROM user_favorites uf 
          WHERE uf.user_id = u.id
        ) as favorites_count,
        (
          SELECT COUNT(*) 
          FROM ratings r 
          WHERE r.user_id = u.id
        ) as ratings_count
      FROM users u
      LEFT JOIN user_stats us ON u.id = us.user_id
      ORDER BY us.last_active DESC, u.created_at DESC
      LIMIT ?
    `, [parseInt(limit)]);
    
    // Formatuj dane
    const formattedActivity = userActivity.map(user => ({
      userId: user.userId,
      email: user.email,
      role: user.role,
      joinedAt: user.joinedAt,
      lastActive: user.last_active,
      totalListeningTime: user.total_listening_time || 0,
      episodesCompleted: user.total_episodes_completed || 0,
      currentStreak: user.current_streak || 0,
      longestStreak: user.longest_streak || 0,
      avgCompletion: user.avg_completion || 0,
      achievementsEarned: user.achievements_earned || 0,
      favoritesCount: user.favorites_count || 0,
      ratingsCount: user.ratings_count || 0
    }));
    
    res.json(formattedActivity);
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;

