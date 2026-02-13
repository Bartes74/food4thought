import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

// Ustal __dirname w środowisku ES Modules (potrzebne do operacji na plikach)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Konfiguracja multer dla uploadów plików audio
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const seriesId = req.body.series_id;
    const uploadDir = path.join(__dirname, '../../public/audio', `seria${seriesId}`, 'polski');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generuj unikalną nazwę pliku
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'); // Sanityzacja nazwy
    const filename = `${timestamp}_${originalName}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Akceptuj tylko pliki MP3
    if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3' || path.extname(file.originalname).toLowerCase() === '.mp3') {
      cb(null, true);
    } else {
      cb(new Error('Tylko pliki MP3 są dozwolone'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

const parsePositiveInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// Przed uploadem do istniejącego odcinka ustaw serię na podstawie ID odcinka.
// Zapobiega to zapisie pliku do katalogu "seriaundefined".
const ensureEpisodeSeriesForUpload = async (req, res, next) => {
  try {
    const episodeId = parsePositiveInt(req.params.id);
    if (!episodeId) {
      return res.status(400).json({ error: 'Nieprawidłowe ID odcinka' });
    }

    const db = await getDb();
    const episode = await db.get('SELECT id, series_id, filename FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }

    req.uploadEpisode = episode;
    req.body = req.body || {};
    req.body.series_id = episode.series_id;

    return next();
  } catch (error) {
    console.error('Resolve upload episode error:', error);
    return res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Funkcja do parsowania pliku z tematami
const parseTopicsFile = async (seriesId, filename) => {
  try {
    // Zamień rozszerzenie .mp3 na .txt
    const topicsFilename = filename.replace('.mp3', '.txt');
    const topicsPath = path.join(__dirname, '../../public/arkusze', `seria${seriesId}`, topicsFilename);
    
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
      episode.audioUrl = `/audio/seria${episode.series_id}/polski/${episode.filename}`;
      
      // Normalizuj pola zgodnie z frontendem HomePage
      episode.position = episode.user_position ?? 0;
      episode.completed = episode.user_completed === 1;
      episode.favorite_date = episode.favorited_at || null;
      episode.is_favorite = episode.is_favorite === 1 || episode.is_favorite === true;

      const isCompleted = episode.completed;
      const hasProgress = episode.position > 0 && !isCompleted;
      
      if (isCompleted) {
        groupedEpisodes.completed.push(episode);
      } else if (hasProgress) {
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
        e.series_id,
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

// Wyszukiwanie odcinków z filtrami (musi być przed /:id)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.user.id, 10);
    const q = String(req.query.q || '').trim();
    const seriesId = req.query.series_id ? parseInt(req.query.series_id, 10) : null;
    const dateFrom = req.query.date_from ? String(req.query.date_from) : null;
    const dateTo = req.query.date_to ? String(req.query.date_to) : null;
    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Number.isInteger(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 100;

    const where = ['s.active = 1'];
    const whereParams = [];

    if (q) {
      const like = `%${q}%`;
      where.push('(e.title LIKE ? OR e.additional_info LIKE ? OR s.name LIKE ?)');
      whereParams.push(like, like, like);
    }

    if (Number.isInteger(seriesId) && seriesId > 0) {
      where.push('e.series_id = ?');
      whereParams.push(seriesId);
    }

    if (dateFrom) {
      where.push('date(e.date_added) >= date(?)');
      whereParams.push(dateFrom);
    }

    if (dateTo) {
      where.push('date(e.date_added) <= date(?)');
      whereParams.push(dateTo);
    }

    const whereClause = where.join(' AND ');

    const episodes = await db.all(`
      SELECT
        e.id,
        e.series_id,
        e.title,
        e.filename,
        e.date_added,
        e.average_rating,
        e.additional_info,
        e.language,
        s.name as series_name,
        s.color as series_color,
        s.image as series_image,
        COALESCE(up.position, 0) as position,
        COALESCE(up.completed, 0) as completed,
        CASE WHEN uf.episode_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM episodes e
      JOIN series s ON e.series_id = s.id
      LEFT JOIN user_progress up ON e.id = up.episode_id AND up.user_id = ?
      LEFT JOIN user_favorites uf ON e.id = uf.episode_id AND uf.user_id = ?
      WHERE ${whereClause}
      ORDER BY e.date_added DESC
      LIMIT ?
    `, [userId, userId, ...whereParams, limit]);

    const totalResult = await db.get(`
      SELECT COUNT(*) as total
      FROM episodes e
      JOIN series s ON e.series_id = s.id
      WHERE ${whereClause}
    `, whereParams);

    const normalizedEpisodes = episodes.map((episode) => ({
      ...episode,
      position: Number(episode.position) || 0,
      completed: episode.completed === 1,
      is_favorite: episode.is_favorite === 1,
      audioUrl: `/audio/seria${episode.series_id}/polski/${episode.filename}`
    }));

    res.json({
      episodes: normalizedEpisodes,
      total: Number(totalResult?.total) || 0,
      query: q
    });
  } catch (error) {
    console.error('Search episodes error:', error);
    res.status(500).json({ error: 'Błąd serwera podczas wyszukiwania odcinków' });
  }
});

// Zapisz tematy odcinka (admin only) - MUSI BYĆ PRZED WSZYSTKIMI /:id
router.post('/:id/topics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const episodeId = parseInt(req.params.id);
    const { content } = req.body;
    
    // Sprawdź czy odcinek istnieje
    const episode = await db.get('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }
    
    // Utwórz katalog jeśli nie istnieje
    const topicsDir = path.join(__dirname, '../../public/arkusze', `seria${episode.series_id}`);
    await fs.promises.mkdir(topicsDir, { recursive: true });
    
    // Zapisz plik z tematami
    const topicsFilename = episode.filename.replace('.mp3', '.txt');
    const topicsPath = path.join(topicsDir, topicsFilename);
    await fs.promises.writeFile(topicsPath, content, 'utf8');
    
    res.json({ message: 'Tematy odcinka zapisane' });
  } catch (error) {
    console.error('Save episode topics error:', error);
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
    
    // Atomowy UPSERT (eliminuje wyścigi powodujące UNIQUE constraint)
    await db.run(`
      INSERT INTO user_progress (user_id, episode_id, position, completed, last_played)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, episode_id)
      DO UPDATE SET 
        position = excluded.position,
        completed = excluded.completed,
        last_played = CURRENT_TIMESTAMP
    `, [userId, episodeId, position, completed ? 1 : 0]);
    
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

// Pobierz ocenę użytkownika i średnią ocenę odcinka
router.get('/:id/rating', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const episodeId = parseInt(req.params.id);
    const userId = parseInt(req.user.id);
    
    // Pobierz ocenę użytkownika
    const userRating = await db.get('SELECT rating FROM ratings WHERE user_id = ? AND episode_id = ?', [userId, episodeId]);
    
    // Pobierz średnią ocenę
    const avgRating = await db.get(`
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as rating_count
      FROM ratings 
      WHERE episode_id = ?
    `, [episodeId]);
    
    res.json({
      userRating: userRating ? userRating.rating : null,
      averageRating: avgRating.average_rating || 0,
      ratingCount: avgRating.rating_count || 0
    });
  } catch (error) {
    console.error('Get rating error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz następny odcinek do automatycznego odtwarzania (Netflix-style)
router.get('/next/:currentEpisodeId', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = parseInt(req.user.id);
    const currentEpisodeId = parseInt(req.params.currentEpisodeId);
    
    // Pobierz informacje o aktualnym odcinku
    const currentEpisode = await db.get(`
      SELECT id, series_id, title, filename
      FROM episodes
      WHERE id = ?
    `, [currentEpisodeId]);
    
    if (!currentEpisode) {
      return res.status(404).json({ error: 'Aktualny odcinek nie znaleziony' });
    }
    
    // Pobierz preferencje użytkownika
    const user = await db.get('SELECT preferences FROM users WHERE id = ?', [userId]);
    const userPrefs = user?.preferences ? JSON.parse(user.preferences) : {};
    const activeSeries = userPrefs.activeSeries || 'all';
    
    // Określ serie do przeszukania
    let seriesIds;
    if (activeSeries === 'all') {
      // Wszystkie aktywne serie
      const allSeries = await db.all('SELECT id FROM series WHERE active = 1');
      seriesIds = allSeries.map(s => s.id);
    } else if (Array.isArray(activeSeries)) {
      // Wybrane serie użytkownika
      seriesIds = activeSeries.map(id => parseInt(id));
    } else {
      // Fallback - wszystkie serie
      const allSeries = await db.all('SELECT id FROM series WHERE active = 1');
      seriesIds = allSeries.map(s => s.id);
    }
    
    // Netflix-style algorithm:
    // 1. Najpierw szukaj niedokończonych odcinków w tej samej serii
    let nextEpisode = await db.get(`
      SELECT 
        e.id,
        e.title,
        e.filename,
        e.series_id,
        e.date_added,
        s.name as series_name,
        s.color as series_color,
        up.position as user_position,
        up.completed as user_completed
      FROM episodes e
      JOIN series s ON e.series_id = s.id
      LEFT JOIN user_progress up ON e.id = up.episode_id AND up.user_id = ?
      WHERE e.series_id = ? 
        AND e.id != ?
        AND s.active = 1
        AND up.position > 0
        AND (up.completed IS NULL OR up.completed = 0)
      ORDER BY e.date_added ASC
      LIMIT 1
    `, [userId, currentEpisode.series_id, currentEpisodeId]);
    
    // 2. Jeśli nie ma niedokończonych, szukaj nowych odcinków w tej samej serii
    if (!nextEpisode) {
      nextEpisode = await db.get(`
        SELECT 
          e.id,
          e.title,
          e.filename,
          e.series_id,
          e.date_added,
          s.name as series_name,
          s.color as series_color,
          up.position as user_position,
          up.completed as user_completed
        FROM episodes e
        JOIN series s ON e.series_id = s.id
        LEFT JOIN user_progress up ON e.id = up.episode_id AND up.user_id = ?
        WHERE e.series_id = ? 
          AND e.id != ?
          AND s.active = 1
          AND up.episode_id IS NULL
        ORDER BY e.date_added ASC
        LIMIT 1
      `, [userId, currentEpisode.series_id, currentEpisodeId]);
    }
    
    // 3. Jeśli nie ma odcinków w tej serii, przejdź do innych serii
    // Sortuj serie według najnowszego odcinka (Netflix-style)
    if (!nextEpisode && seriesIds.length > 1) {
      const seriesWithLatestEpisodes = await db.all(`
        SELECT 
          s.id,
          s.name,
          MAX(e.date_added) as latest_episode_date
        FROM series s
        JOIN episodes e ON s.id = e.series_id
        WHERE s.id IN (${seriesIds.map(() => '?').join(',')}) 
          AND s.active = 1
          AND s.id != ?
        GROUP BY s.id, s.name
        ORDER BY latest_episode_date DESC
      `, [...seriesIds, currentEpisode.series_id]);
      
      // Przeszukaj serie w kolejności od najnowszych
      for (const series of seriesWithLatestEpisodes) {
        // Szukaj niedokończonych odcinków w tej serii
        nextEpisode = await db.get(`
          SELECT 
            e.id,
            e.title,
            e.filename,
            e.series_id,
            e.date_added,
            s.name as series_name,
            s.color as series_color,
            up.position as user_position,
            up.completed as user_completed
          FROM episodes e
          JOIN series s ON e.series_id = s.id
          LEFT JOIN user_progress up ON e.id = up.episode_id AND up.user_id = ?
          WHERE e.series_id = ? 
            AND s.active = 1
            AND up.position > 0
            AND (up.completed IS NULL OR up.completed = 0)
          ORDER BY e.date_added ASC
          LIMIT 1
        `, [userId, series.id]);
        
        if (nextEpisode) break;
        
        // Jeśli nie ma niedokończonych, szukaj nowych odcinków
        nextEpisode = await db.get(`
          SELECT 
            e.id,
            e.title,
            e.filename,
            e.series_id,
            e.date_added,
            s.name as series_name,
            s.color as series_color,
            up.position as user_position,
            up.completed as user_completed
          FROM episodes e
          JOIN series s ON e.series_id = s.id
          LEFT JOIN user_progress up ON e.id = up.episode_id AND up.user_id = ?
          WHERE e.series_id = ? 
            AND s.active = 1
            AND up.episode_id IS NULL
          ORDER BY e.date_added ASC
          LIMIT 1
        `, [userId, series.id]);
        
        if (nextEpisode) break;
      }
    }
    
    if (nextEpisode) {
      // Dodaj audioUrl
      nextEpisode.audioUrl = `/audio/seria${nextEpisode.series_id}/polski/${nextEpisode.filename}`;
      
      // Określ typ autoplaya
      const isInProgress = nextEpisode.user_position > 0;
      const isSameSeries = nextEpisode.series_id === currentEpisode.series_id;
      
      res.json({
        nextEpisode,
        autoPlayType: {
          isSameSeries,
          isInProgress,
          reason: isSameSeries 
            ? (isInProgress ? 'continue-same-series' : 'new-same-series')
            : (isInProgress ? 'continue-other-series' : 'new-other-series')
        },
        message: `Następny odcinek: ${nextEpisode.title} (${nextEpisode.series_name})${isInProgress ? ' - kontynuacja' : ''}`
      });
    } else {
      res.json({
        nextEpisode: null,
        autoPlayType: null,
        message: 'Brak więcej odcinków do odtworzenia w wybranych seriach'
      });
    }
  } catch (error) {
    console.error('Get next episode error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Utworz nowy odcinek (admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('audio'), async (req, res) => {
  try {
    const db = await getDb();
    const { title, series_id, language = 'polski', additional_info = '', topics_content = '' } = req.body;
    
    // Walidacja wymaganych pol
    if (!title || !series_id) {
      return res.status(400).json({ error: 'Tytul i seria sa wymagane' });
    }
    
    // Sprawdz czy seria istnieje
    const series = await db.get('SELECT * FROM series WHERE id = ? AND active = 1', [series_id]);
    if (!series) {
      return res.status(404).json({ error: 'Seria nie znaleziona' });
    }
    
    // Określ nazwę pliku
    let filename;
    if (req.file) {
      // Użyj nazwy uploaded pliku
      filename = req.file.filename;
    } else {
      // Wygeneruj tymczasową nazwę pliku jesli nie ma uploadu
      const timestamp = Date.now();
      filename = `episode_${timestamp}.mp3`;
    }
    
    // Utworz odcinek w bazie danych
    const result = await db.run(
      'INSERT INTO episodes (title, series_id, filename, language, additional_info, date_added) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [title, parseInt(series_id), filename, language, additional_info]
    );
    
    const episodeId = result.lastID;
    
    // Jesli podano tresc tematow, zapisz ja
    if (topics_content && topics_content.trim()) {
      const topicsDir = path.join(__dirname, '../../public/arkusze', `seria${series_id}`);
      await fs.promises.mkdir(topicsDir, { recursive: true });
      
      const topicsFilename = filename.replace('.mp3', '.txt');
      const topicsPath = path.join(topicsDir, topicsFilename);
      await fs.promises.writeFile(topicsPath, topics_content, 'utf8');
    }
    
    // Pobierz utworzony odcinek z informacjami o serii
    const newEpisode = await db.get(`
      SELECT 
        e.*,
        s.name as series_name,
        s.color as series_color,
        s.image as series_image
      FROM episodes e
      JOIN series s ON e.series_id = s.id
      WHERE e.id = ?
    `, [episodeId]);
    
    const responseMessage = req.file 
      ? 'Odcinek utworzony pomyslnie z plikiem audio'
      : 'Odcinek utworzony (mozesz pozniej dodac plik audio)';
    
    res.status(201).json({
      message: responseMessage,
      episode: newEpisode,
      hasAudioFile: !!req.file
    });
  } catch (error) {
    console.error('Create episode error:', error);
    res.status(500).json({ error: 'Blad serwera' });
  }
});

// Upload pliku audio do istniejacego odcinka (admin only)
router.post('/:id/upload-audio', authenticateToken, requireAdmin, ensureEpisodeSeriesForUpload, upload.single('audio'), async (req, res) => {
  try {
    const db = await getDb();
    const episodeId = parseInt(req.params.id);
    const episode = req.uploadEpisode;
    
    // Sprawdz czy plik zostal przeslany
    if (!req.file) {
      return res.status(400).json({ error: 'Nie przeslano pliku audio' });
    }
    
    // Usun stary plik jesli istnieje i nie jest tymczasowy
    if (episode.filename && !episode.filename.startsWith('episode_')) {
      const oldFilePath = path.join(__dirname, '../../public/audio', `seria${episode.series_id}`, 'polski', episode.filename);
      try {
        await fs.promises.unlink(oldFilePath);
      } catch (e) {
        console.log('Nie mozna usunac starego pliku audio:', e.message);
      }
    }
    
    // Zaktualizuj nazwe pliku w bazie danych
    await db.run('UPDATE episodes SET filename = ? WHERE id = ?', [req.file.filename, episodeId]);
    
    // Pobierz zaktualizowany odcinek
    const updatedEpisode = await db.get(`
      SELECT 
        e.*,
        s.name as series_name,
        s.color as series_color,
        s.image as series_image
      FROM episodes e
      JOIN series s ON e.series_id = s.id
      WHERE e.id = ?
    `, [episodeId]);
    
    res.json({
      message: 'Plik audio przeslany pomyslnie',
      episode: updatedEpisode
    });
  } catch (error) {
    console.error('Upload audio error:', error);
    res.status(500).json({ error: 'Blad serwera' });
  }
});

// Aktualizuj odcinek (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const episodeId = parseInt(req.params.id);
    const { title, series_id, language, additional_info, topics_content } = req.body;
    
    // Sprawdz czy odcinek istnieje
    const episode = await db.get('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }
    
    // Jesli zmieniono serie, sprawdz czy nowa seria istnieje
    if (series_id && series_id !== episode.series_id) {
      const series = await db.get('SELECT * FROM series WHERE id = ? AND active = 1', [series_id]);
      if (!series) {
        return res.status(404).json({ error: 'Nowa seria nie znaleziona' });
      }
    }
    
    // Przygotuj pola do aktualizacji
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    
    if (series_id !== undefined) {
      updates.push('series_id = ?');
      values.push(parseInt(series_id));
    }
    
    if (language !== undefined) {
      updates.push('language = ?');
      values.push(language);
    }
    
    if (additional_info !== undefined) {
      updates.push('additional_info = ?');
      values.push(additional_info);
    }
    
    // Aktualizuj odcinek jesli sa zmiany
    if (updates.length > 0) {
      values.push(episodeId);
      await db.run(
        `UPDATE episodes SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
    
    // Aktualizuj tematy jesli podano
    if (topics_content !== undefined) {
      const currentSeriesId = series_id || episode.series_id;
      const topicsDir = path.join(__dirname, '../../public/arkusze', `seria${currentSeriesId}`);
      await fs.promises.mkdir(topicsDir, { recursive: true });
      
      const topicsFilename = episode.filename.replace('.mp3', '.txt');
      const topicsPath = path.join(topicsDir, topicsFilename);
      
      if (topics_content.trim()) {
        await fs.promises.writeFile(topicsPath, topics_content, 'utf8');
      } else {
        // Usun plik tematow jesli tresc jest pusta
        try {
          await fs.promises.unlink(topicsPath);
        } catch (e) {
          // Plik moze nie istniec
        }
      }
    }
    
    // Pobierz zaktualizowany odcinek
    const updatedEpisode = await db.get(`
      SELECT 
        e.*,
        s.name as series_name,
        s.color as series_color,
        s.image as series_image
      FROM episodes e
      JOIN series s ON e.series_id = s.id
      WHERE e.id = ?
    `, [episodeId]);
    
    res.json({
      message: 'Odcinek zaktualizowany',
      episode: updatedEpisode
    });
  } catch (error) {
    console.error('Update episode error:', error);
    res.status(500).json({ error: 'Blad serwera' });
  }
});

// Usun odcinek (admin only)
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
