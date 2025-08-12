import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Pobierz wszystkie odcinki z informacjami o serii
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const episodes = await db.all(`
      SELECT 
        e.*,
        s.name as series_name,
        s.color as series_color,
        s.image as series_image
      FROM episodes e
      JOIN series s ON e.series_id = s.id
      WHERE s.active = 1
      ORDER BY e.date_added DESC
    `);
    res.json(episodes);
  } catch (error) {
    console.error('Get episodes error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz odcinki użytkownika
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.user.id);
    
    // Pobierz wszystkie odcinki z informacjami o serii i statusie użytkownika
    const episodes = await db.all(`
      SELECT 
        e.*,
        s.name as series_name,
        s.color as series_color,
        s.image as series_image,
        ls.completion_rate as user_completion_rate,
        ls.duration_seconds as user_duration,
        ls.start_time as user_start_time,
        ls.end_time as user_end_time,
        r.rating as user_rating,
        r.created_at as rated_at,
        uf.episode_id as is_favorite,
        uf.added_at as favorited_at
      FROM episodes e
      JOIN series s ON e.series_id = s.id
      LEFT JOIN listening_sessions ls ON e.id = ls.episode_id AND ls.user_id = ?
      LEFT JOIN ratings r ON e.id = r.episode_id AND r.user_id = ?
      LEFT JOIN user_favorites uf ON e.id = uf.episode_id AND uf.user_id = ?
      WHERE s.active = 1
      ORDER BY e.date_added DESC
    `, [userId, userId, userId]);
    
    // Grupuj odcinki według statusu
    const groupedEpisodes = {
      new: [],
      inProgress: [],
      completed: []
    };
    
    episodes.forEach(episode => {
      // Dodaj audioUrl do każdego odcinka z właściwą strukturą folderów
      episode.audioUrl = `/audio/seria${episode.series_id}/polski/${episode.filename}`;
      
      const completionRate = episode.user_completion_rate || 0;
      const hasEndTime = episode.user_end_time !== null;
      
      if (completionRate >= 0.9 || hasEndTime) {
        groupedEpisodes.completed.push(episode);
      } else if (completionRate > 0 || episode.user_start_time !== null) {
        groupedEpisodes.inProgress.push(episode);
      } else {
        groupedEpisodes.new.push(episode);
      }
    });
    
    res.json(groupedEpisodes);
  } catch (error) {
    console.error('Get user episodes error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz najwyżej oceniane odcinki użytkownika (musi być przed /:id)
router.get('/my/top-rated', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.user.id);
    
    const topRatedEpisodes = await db.all(`
      SELECT 
        e.id,
        e.title,
        e.filename,
        s.name as series_name,
        s.color as series_color,
        r.rating,
        r.created_at as rated_at
      FROM episodes e
      JOIN series s ON e.series_id = s.id
      JOIN ratings r ON e.id = r.episode_id
      WHERE r.user_id = ?
      ORDER BY r.rating DESC, r.created_at DESC
      LIMIT 10
    `, [userId]);
    
    // Dodaj audioUrl do każdego odcinka
    topRatedEpisodes.forEach(episode => {
      episode.audioUrl = `/audio/seria${episode.series_id}/polski/${episode.filename}`;
    });
    
    res.json(topRatedEpisodes);
  } catch (error) {
    console.error('Get top rated episodes error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz ulubione odcinki użytkownika (musi być przed /:id)
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.user.id);
    const { search } = req.query;
    
    let query = `
      SELECT 
        e.*,
        s.name as series_name,
        s.color as series_color,
        s.image as series_image,
        uf.added_at as favorited_at
      FROM episodes e
      JOIN series s ON e.series_id = s.id
      JOIN user_favorites uf ON e.id = uf.episode_id
      WHERE uf.user_id = ? AND s.active = 1
    `;
    
    const params = [userId];
    
    if (search) {
      query += ` AND (e.title LIKE ? OR s.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY uf.added_at DESC`;
    
    const favorites = await db.all(query, params);
    
    // Dodaj audioUrl do każdego ulubionego odcinka
    favorites.forEach(episode => {
      episode.audioUrl = `/audio/seria${episode.series_id}/polski/${episode.filename}`;
    });
    
    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});



// Pobierz odcinek po ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const episodeId = parseInt(req.params.id);
    
    const episode = await db.get(`
      SELECT e.*, s.id as series_id 
      FROM episodes e 
      JOIN series s ON e.series_id = s.id 
      WHERE e.id = ?
    `, [episodeId]);
    
    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }
    
    // Dodaj audioUrl do odpowiedzi z właściwą strukturą folderów
    episode.audioUrl = `/audio/seria${episode.series_id}/polski/${episode.filename}`;
    
    res.json(episode);
  } catch (error) {
    console.error('Get episode error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Zapisz postęp odcinka
router.post('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const episodeId = parseInt(req.params.id);
    const { position, completed } = req.body;
    
    // Sprawdź czy odcinek istnieje
    const episode = await db.get('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }
    
    res.json({ message: 'Postęp zapisany' });
  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Dodaj do ulubionych
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const episodeId = parseInt(req.params.id);
    const userId = parseInt(req.user.id);
    
    // Sprawdź czy odcinek istnieje
    const episode = await db.get('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }
    
    // Sprawdź czy już jest w ulubionych
    const existing = await db.get('SELECT * FROM user_favorites WHERE user_id = ? AND episode_id = ?', [userId, episodeId]);
    if (existing) {
      return res.status(400).json({ error: 'Odcinek już jest w ulubionych' });
    }
    
    // Dodaj do ulubionych
    await db.run('INSERT INTO user_favorites (user_id, episode_id) VALUES (?, ?)', [userId, episodeId]);
    
    res.json({ message: 'Dodano do ulubionych' });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Usuń z ulubionych
router.delete('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const episodeId = parseInt(req.params.id);
    const userId = parseInt(req.user.id);
    
    // Sprawdź czy odcinek istnieje
    const episode = await db.get('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }
    
    // Usuń z ulubionych
    const result = await db.run('DELETE FROM user_favorites WHERE user_id = ? AND episode_id = ?', [userId, episodeId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Odcinek nie był w ulubionych' });
    }
    
    res.json({ message: 'Usunięto z ulubionych' });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});



// Usuń odcinek (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const episodeId = parseInt(req.params.id);
    
    // Sprawdź czy odcinek istnieje
    const episode = await db.get('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }
    
    // Usuń wszystkie powiązane dane
    await db.run('DELETE FROM user_favorites WHERE episode_id = ?', [episodeId]);
    await db.run('DELETE FROM ratings WHERE episode_id = ?', [episodeId]);
    await db.run('DELETE FROM listening_sessions WHERE episode_id = ?', [episodeId]);
    await db.run('DELETE FROM episodes WHERE id = ?', [episodeId]);
    
    res.json({ message: 'Odcinek usunięty' });
  } catch (error) {
    console.error('Delete episode error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
