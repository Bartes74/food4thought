import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Funkcja do parsowania pliku z tematami
const parseTopicsFile = async (seriesId, filename) => {
  try {
    // Zamień rozszerzenie .mp3 na .txt
    const topicsFilename = filename.replace('.mp3', '.txt');
    const topicsPath = path.join(__dirname, '../../../public/arkusze', `seria${seriesId}`, topicsFilename);
    
    const content = await fs.promises.readFile(topicsPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const topics = [];
    let currentTopic = null;
    
    for (const line of lines) {
      // Sprawdź czy to timestamp z tematem [MM:SS] # Tytuł
      const timestampMatch = line.match(/^\[(\d{2}:\d{2})\]\s*#\s*(.+)$/);
      if (timestampMatch) {
        if (currentTopic) {
          topics.push(currentTopic);
        }
        
        const [, timestamp, title] = timestampMatch;
        const [minutes, seconds] = timestamp.split(':').map(Number);
        const timeInSeconds = minutes * 60 + seconds;
        
        currentTopic = {
          title: title.trim(),
          timestamp: timestamp,
          timeInSeconds: timeInSeconds,
          links: []
        };
      } else if (currentTopic && line.trim().startsWith('-')) {
        // To jest link
        const link = line.trim().substring(1).trim();
        if (link) {
          currentTopic.links.push(link);
        }
      }
    }
    
    // Dodaj ostatni temat
    if (currentTopic) {
      topics.push(currentTopic);
    }
    
    return topics;
  } catch (error) {
    console.log(`Nie znaleziono pliku z tematami dla seria${seriesId}/${filename.replace('.mp3', '.txt')}`);
    return [];
  }
};

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
    // Zoptymalizowane zapytanie z lepszymi indeksami
    const episodes = await db.all(`
      SELECT 
        e.id,
        e.series_id,
        e.title,
        e.filename,
        e.date_added,
        e.average_rating,
        e.additional_info,
        s.name as series_name,
        s.color as series_color,
        s.image as series_image,
        COALESCE(up.position, 0) as user_position,
        COALESCE(up.completed, 0) as user_completed,
        up.last_played as user_last_played,
        COALESCE(r.rating, 0) as user_rating,
        r.created_at as rated_at,
        CASE WHEN uf.episode_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite,
        uf.added_at as favorited_at
      FROM episodes e
      INNER JOIN series s ON e.series_id = s.id AND s.active = 1
      LEFT JOIN user_progress up ON e.id = up.episode_id AND up.user_id = ?
      LEFT JOIN ratings r ON e.id = r.episode_id AND r.user_id = ?
      LEFT JOIN user_favorites uf ON e.id = uf.episode_id AND uf.user_id = ?
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
      
      const isCompleted = episode.user_completed === 1;
      const hasProgress = episode.user_position !== null && episode.user_position > 0;
      
      if (isCompleted) {
        groupedEpisodes.completed.push(episode);
      } else if (hasProgress) {
        // Odcinki w trakcie - te które mają zapisany postęp
        groupedEpisodes.inProgress.push(episode);
      } else {
        // Odcinki nowe - bez zapisanego postępu
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

// Pobierz ostatni słuchany odcinek użytkownika
router.get('/last-played', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.user.id);
    
    // Pobierz ostatni odcinek z najnowszym last_played
    const lastPlayedEpisode = await db.get(`
      SELECT 
        e.*,
        s.name as series_name,
        s.color as series_color,
        s.image as series_image,
        up.position,
        up.completed,
        up.last_played,
        r.rating as user_rating,
        r.created_at as rated_at,
        uf.episode_id as is_favorite,
        uf.added_at as favorited_at
      FROM episodes e
      JOIN series s ON e.series_id = s.id
      JOIN user_progress up ON e.id = up.episode_id
      LEFT JOIN ratings r ON e.id = r.episode_id AND r.user_id = ?
      LEFT JOIN user_favorites uf ON e.id = uf.episode_id AND uf.user_id = ?
      WHERE up.user_id = ? AND s.active = 1
      ORDER BY up.last_played DESC
      LIMIT 1
    `, [userId, userId, userId]);
    
    if (lastPlayedEpisode) {
      // Dodaj audioUrl
      lastPlayedEpisode.audioUrl = `/audio/seria${lastPlayedEpisode.series_id}/polski/${lastPlayedEpisode.filename}`;
      
      // Dodaj informacje o średniej ocenie
      const avgRating = await db.get(`
        SELECT 
          AVG(rating) as average_rating,
          COUNT(*) as rating_count
        FROM ratings 
        WHERE episode_id = ?
      `, [lastPlayedEpisode.id]);
      
      lastPlayedEpisode.average_rating = avgRating.average_rating || 0;
      lastPlayedEpisode.rating_count = avgRating.rating_count || 0;
    }
    
    res.json(lastPlayedEpisode);
  } catch (error) {
    console.error('Get last played episode error:', error);
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
        uf.added_at as favorited_at,
        r.rating as user_rating,
        r.created_at as rated_at,
        up.position as user_position,
        up.completed as user_completed,
        up.last_played as user_last_played
      FROM episodes e
      JOIN series s ON e.series_id = s.id
      JOIN user_favorites uf ON e.id = uf.episode_id
      LEFT JOIN ratings r ON e.id = r.episode_id AND r.user_id = ?
      LEFT JOIN user_progress up ON e.id = up.episode_id AND up.user_id = ?
      WHERE uf.user_id = ? AND s.active = 1
    `;
    
    const params = [userId, userId, userId];
    
    if (search) {
      query += ` AND (e.title LIKE ? OR s.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY uf.added_at DESC`;
    
    const favorites = await db.all(query, params);
    
    // Pobierz średnie oceny dla wszystkich ulubionych odcinków
    const episodeIds = favorites.map(f => f.id);
    let averageRatings = {};
    
    if (episodeIds.length > 0) {
      const placeholders = episodeIds.map(() => '?').join(',');
      const avgQuery = `
        SELECT 
          episode_id,
          AVG(rating) as average_rating,
          COUNT(*) as rating_count
        FROM ratings 
        WHERE episode_id IN (${placeholders})
        GROUP BY episode_id
      `;
      
      const avgResults = await db.all(avgQuery, episodeIds);
      avgResults.forEach(result => {
        averageRatings[result.episode_id] = {
          average_rating: result.average_rating || 0,
          rating_count: result.rating_count || 0
        };
      });
    }
    
    // Dodaj audioUrl i średnie oceny do każdego ulubionego odcinka
    favorites.forEach(episode => {
      episode.audioUrl = `/audio/seria${episode.series_id}/polski/${episode.filename}`;
      episode.average_rating = averageRatings[episode.id]?.average_rating || 0;
      episode.rating_count = averageRatings[episode.id]?.rating_count || 0;
      
      // Dodaj status odcinka
      const isCompleted = episode.user_completed === 1;
      const hasProgress = episode.user_position !== null && episode.user_position > 0;
      
      if (isCompleted) {
        episode.status = 'completed';
      } else if (hasProgress) {
        episode.status = 'in_progress';
      } else {
        episode.status = 'not_started';
      }
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
    const userId = parseInt(req.user.id);
    
    const episode = await db.get(`
      SELECT 
        e.*,
        s.id as series_id,
        s.name as series_name,
        s.color as series_color,
        s.image as series_image,
        up.position as user_position,
        up.completed as user_completed,
        up.last_played as user_last_played,
        r.rating as user_rating,
        r.created_at as rated_at,
        uf.episode_id as is_favorite,
        uf.added_at as favorited_at
      FROM episodes e 
      JOIN series s ON e.series_id = s.id 
      LEFT JOIN user_progress up ON e.id = up.episode_id AND up.user_id = ?
      LEFT JOIN ratings r ON e.id = r.episode_id AND r.user_id = ?
      LEFT JOIN user_favorites uf ON e.id = uf.episode_id AND uf.user_id = ?
      WHERE e.id = ?
    `, [userId, userId, userId, episodeId]);
    
    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }
    
    // Pobierz średnią ocenę
    const avgRating = await db.get(`
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as rating_count
      FROM ratings 
      WHERE episode_id = ?
    `, [episodeId]);
    
    // Dodaj audioUrl i oceny do odpowiedzi
    episode.audioUrl = `/audio/seria${episode.series_id}/polski/${episode.filename}`;
    episode.average_rating = avgRating.average_rating || 0;
    episode.rating_count = avgRating.rating_count || 0;
    
    res.json(episode);
  } catch (error) {
    console.error('Get episode error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz tematy odcinka
router.get('/:id/topics', authenticateToken, async (req, res) => {
  try {
    const episodeId = parseInt(req.params.id);
    const db = await getDb();
    
    // Pobierz informacje o odcinku
    const episode = await db.get(`
      SELECT id, series_id, filename, title
      FROM episodes
      WHERE id = ?
    `, [episodeId]);
    
    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }
    
    // Pobierz tematy z pliku
    const topics = await parseTopicsFile(episode.series_id, episode.filename);
    
    res.json({
      episodeId: episode.id,
      episodeTitle: episode.title,
      topics: topics
    });
  } catch (error) {
    console.error('Get episode topics error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Zapisz postęp odcinka
router.post('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const episodeId = parseInt(req.params.id);
    const userId = parseInt(req.user.id);
    const { position, completed } = req.body;
    
    // Sprawdź czy odcinek istnieje
    const episode = await db.get('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }
    
    // Sprawdź czy istnieje już wpis w user_progress
    const existingProgress = await db.get('SELECT * FROM user_progress WHERE user_id = ? AND episode_id = ?', [userId, episodeId]);
    
    if (existingProgress) {
      // Aktualizuj istniejący wpis
      await db.run(`
        UPDATE user_progress 
        SET position = ?, completed = ?, last_played = CURRENT_TIMESTAMP
        WHERE user_id = ? AND episode_id = ?
      `, [position, completed ? 1 : 0, userId, episodeId]);
    } else {
      // Utwórz nowy wpis
      await db.run(`
        INSERT INTO user_progress (user_id, episode_id, position, completed, last_played)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [userId, episodeId, position, completed ? 1 : 0]);
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
    
    res.json({ message: 'Dodano do ulubionych', isFavorite: true });
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
    
    res.json({ message: 'Usunięto z ulubionych', isFavorite: false });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Dodaj ocenę odcinka
router.post('/:id/rating', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const episodeId = parseInt(req.params.id);
    const userId = parseInt(req.user.id);
    const { rating } = req.body;
    
    // Sprawdź czy ocena jest w prawidłowym zakresie
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Ocena musi być między 1 a 5' });
    }
    
    // Sprawdź czy odcinek istnieje
    const episode = await db.get('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }
    
    // Sprawdź czy użytkownik już ocenił ten odcinek
    const existingRating = await db.get('SELECT * FROM ratings WHERE user_id = ? AND episode_id = ?', [userId, episodeId]);
    
    if (existingRating) {
      // Aktualizuj istniejącą ocenę
      await db.run('UPDATE ratings SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND episode_id = ?', [rating, userId, episodeId]);
    } else {
      // Dodaj nową ocenę
      await db.run('INSERT INTO ratings (user_id, episode_id, rating) VALUES (?, ?, ?)', [userId, episodeId, rating]);
    }
    
    res.json({ message: 'Ocena zapisana' });
  } catch (error) {
    console.error('Save rating error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz ocenę użytkownika dla odcinka
router.get('/:id/rating', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const episodeId = parseInt(req.params.id);
    const userId = parseInt(req.user.id);
    
    const rating = await db.get('SELECT rating FROM ratings WHERE user_id = ? AND episode_id = ?', [userId, episodeId]);
    
    res.json({ rating: rating ? rating.rating : null });
  } catch (error) {
    console.error('Get rating error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz średnią ocenę odcinka
router.get('/:id/average-rating', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const episodeId = parseInt(req.params.id);
    
    const result = await db.get(`
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as rating_count
      FROM ratings 
      WHERE episode_id = ?
    `, [episodeId]);
    
    res.json({
      average_rating: result.average_rating || 0,
      rating_count: result.rating_count || 0
    });
  } catch (error) {
    console.error('Get average rating error:', error);
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
