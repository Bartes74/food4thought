import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import db from '../database.js';
import { fileURLToPath } from 'url';
import { checkAndAwardAchievements, initializeUserStats } from '../utils/achievementTracker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Konfiguracja multer dla uploadu plików
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const seriesId = req.body.series_id;
    const language = req.body.language || 'polski';
    
    // Sprawdź czy seria istnieje
    db.get('SELECT name FROM series WHERE id = ?', [seriesId], async (err, series) => {
      if (err || !series) {
        return cb(new Error('Nieprawidłowa seria'));
      }
      
      // Utwórz folder jeśli nie istnieje
      const dir = path.join(__dirname, '../../../public/audio', `seria${seriesId}`, language);
      try {
        await fs.mkdir(dir, { recursive: true });
        cb(null, dir);
      } catch (error) {
        cb(error);
      }
    });
  },
  filename: (req, file, cb) => {
    // Format: YYYY_MM_DD_nazwa_pliku.mp3
    const date = new Date();
    const dateStr = `${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}_${String(date.getDate()).padStart(2, '0')}`;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${dateStr}_${safeName}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Akceptuj tylko pliki MP3
    if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3') {
      cb(null, true);
    } else {
      cb(new Error('Dozwolone są tylko pliki MP3'));
    }
  },
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB max
  }
});

// TEST endpoint bez autoryzacji - DO USUNIĘCIA PO TESTACH
router.get('/search-test', async (req, res) => {
  console.log('🧪 TEST Search endpoint called!');
  res.json({ 
    message: 'Search endpoint works!', 
    query: req.query,
    timestamp: new Date().toISOString()
  });
});

// Pobierz wszystkie odcinki użytkownika
router.get('/my', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  // Pobierz preferencje użytkownika
  db.get(
    `SELECT preferences FROM users WHERE id = ?`,
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd pobierania preferencji' });
      }
      
      const preferences = JSON.parse(user.preferences || '{}');
      const activeSeries = preferences.activeSeries || 'all';
      
      // Sprawdź czy użytkownik wybrał konkretne serie
      if (activeSeries !== 'all' && Array.isArray(activeSeries) && activeSeries.length > 0) {
        // Konwertuj stringi na liczby (ID serii)
        const seriesIds = activeSeries.map(id => parseInt(id)).filter(id => !isNaN(id));
        
        if (seriesIds.length > 0) {
          // Sprawdź które z wybranych serii istnieją
          const placeholders = seriesIds.map(() => '?').join(',');
          const checkSeriesQuery = `SELECT id FROM series WHERE id IN (${placeholders}) AND active = 1`;
          
          db.all(checkSeriesQuery, seriesIds, (err, existingSeries) => {
            if (err) {
              console.error('Błąd sprawdzania serii:', err);
              return res.status(500).json({ error: 'Błąd sprawdzania serii' });
            }
            
            const existingSeriesIds = existingSeries.map(s => s.id);
            
            // Jeśli żadna z wybranych serii nie istnieje, pokaż wszystkie odcinki
            if (existingSeriesIds.length === 0) {
              console.log(`Użytkownik ${userId}: Żadna z wybranych serii nie istnieje, pokazuję wszystkie odcinki`);
              fetchAllEpisodes(userId, res);
            } else {
              // Pokaż odcinki tylko z istniejących serii
              console.log(`Użytkownik ${userId}: Pokazuję odcinki z istniejących serii:`, existingSeriesIds);
              fetchEpisodesBySeries(userId, existingSeriesIds, res);
            }
          });
        } else {
          // Brak poprawnych ID serii, pokaż wszystkie odcinki
          console.log(`Użytkownik ${userId}: Brak poprawnych ID serii, pokazuję wszystkie odcinki`);
          fetchAllEpisodes(userId, res);
        }
      } else {
        // Użytkownik nie ma wybranych serii, pokaż wszystkie odcinki
        fetchAllEpisodes(userId, res);
      }
    }
  );
});

// Funkcja pomocnicza do pobierania wszystkich odcinków
function fetchAllEpisodes(userId, res) {
  // Najpierw pobierz podstawowe dane odcinków
  const query = `
    SELECT e.*, s.name as series_name,
    up.position, up.completed, up.last_played,
    uf.added_at as favorite_date,
    ur.rating as user_rating
    FROM episodes e
    JOIN series s ON e.series_id = s.id
    LEFT JOIN user_progress up ON e.id = up.episode_id AND up.user_id = ?
    LEFT JOIN user_favorites uf ON e.id = uf.episode_id AND uf.user_id = ?
    LEFT JOIN ratings ur ON e.id = ur.episode_id AND ur.user_id = ?
    WHERE s.active = 1
    ORDER BY e.date_added DESC
  `;
  
  db.all(query, [userId, userId, userId], (err, episodes) => {
    if (err) {
      console.error('Błąd pobierania odcinków:', err);
      return res.status(500).json({ error: 'Błąd pobierania odcinków' });
    }
    
    // Następnie pobierz średnie oceny dla wszystkich odcinków
    if (episodes.length > 0) {
      const episodeIds = episodes.map(e => e.id);
      const placeholders = episodeIds.map(() => '?').join(',');
      const ratingQuery = `
        SELECT episode_id, AVG(rating) as average_rating, COUNT(rating) as rating_count
        FROM ratings 
        WHERE episode_id IN (${placeholders})
        GROUP BY episode_id
      `;
      
      db.all(ratingQuery, episodeIds, (err, ratingStats) => {
        if (err) {
          console.error('Błąd pobierania statystyk ocen:', err);
          // Kontynuuj bez statystyk ocen
          const grouped = {
            new: episodes.filter(e => !e.position && !e.completed),
            inProgress: episodes.filter(e => e.position && !e.completed),
            completed: episodes.filter(e => e.completed)
          };
          return res.json(grouped);
        }
        
        // Połącz dane
        const ratingMap = {};
        ratingStats.forEach(stat => {
          ratingMap[stat.episode_id] = {
            average_rating: parseFloat(stat.average_rating.toFixed(1)),
            rating_count: stat.rating_count
          };
        });
        
        episodes.forEach(episode => {
          const stats = ratingMap[episode.id] || { average_rating: 0, rating_count: 0 };
          episode.average_rating = stats.average_rating;
          episode.rating_count = stats.rating_count;
        });
        
        // Grupuj odcinki według statusu
        const grouped = {
          new: episodes.filter(e => !e.position && !e.completed),
          inProgress: episodes.filter(e => e.position && !e.completed),
          completed: episodes.filter(e => e.completed)
        };
        
        res.json(grouped);
      });
    } else {
      // Brak odcinków
      res.json({
        new: [],
        inProgress: [],
        completed: []
      });
    }
  });
}

// Funkcja pomocnicza do pobierania odcinków z określonych serii
function fetchEpisodesBySeries(userId, seriesIds, res) {
  const placeholders = seriesIds.map(() => '?').join(',');
  const query = `
    SELECT e.*, s.name as series_name,
    up.position, up.completed, up.last_played,
    uf.added_at as favorite_date,
    ur.rating as user_rating
    FROM episodes e
    JOIN series s ON e.series_id = s.id
    LEFT JOIN user_progress up ON e.id = up.episode_id AND up.user_id = ?
    LEFT JOIN user_favorites uf ON e.id = uf.episode_id AND uf.user_id = ?
    LEFT JOIN ratings ur ON e.id = ur.episode_id AND ur.user_id = ?
    WHERE s.active = 1 AND s.id IN (${placeholders})
    ORDER BY e.date_added DESC
  `;
  
  const params = [userId, userId, userId, ...seriesIds];
  
  db.all(query, params, (err, episodes) => {
    if (err) {
      console.error('Błąd pobierania odcinków:', err);
      return res.status(500).json({ error: 'Błąd pobierania odcinków' });
    }
    
    // Następnie pobierz średnie oceny dla wszystkich odcinków
    if (episodes.length > 0) {
      const episodeIds = episodes.map(e => e.id);
      const ratingPlaceholders = episodeIds.map(() => '?').join(',');
      const ratingQuery = `
        SELECT episode_id, AVG(rating) as average_rating, COUNT(rating) as rating_count
        FROM ratings 
        WHERE episode_id IN (${ratingPlaceholders})
        GROUP BY episode_id
      `;
      
      db.all(ratingQuery, episodeIds, (err, ratingStats) => {
        if (err) {
          console.error('Błąd pobierania statystyk ocen:', err);
          // Kontynuuj bez statystyk ocen
          const grouped = {
            new: episodes.filter(e => !e.position && !e.completed),
            inProgress: episodes.filter(e => e.position && !e.completed),
            completed: episodes.filter(e => e.completed)
          };
          return res.json(grouped);
        }
        
        // Połącz dane
        const ratingMap = {};
        ratingStats.forEach(stat => {
          ratingMap[stat.episode_id] = {
            average_rating: parseFloat(stat.average_rating.toFixed(1)),
            rating_count: stat.rating_count
          };
        });
        
        episodes.forEach(episode => {
          const stats = ratingMap[episode.id] || { average_rating: 0, rating_count: 0 };
          episode.average_rating = stats.average_rating;
          episode.rating_count = stats.rating_count;
        });
        
        // Grupuj odcinki według statusu
        const grouped = {
          new: episodes.filter(e => !e.position && !e.completed),
          inProgress: episodes.filter(e => e.position && !e.completed),
          completed: episodes.filter(e => e.completed)
        };
        
        res.json(grouped);
      });
    } else {
      // Brak odcinków
      res.json({
        new: [],
        inProgress: [],
        completed: []
      });
    }
  });
}

// Pobierz ulubione odcinki użytkownika
router.get('/favorites', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { search } = req.query;
  
  let query = `
    SELECT 
      e.id,
      e.title,
      e.filename,
      e.date_added,
      e.additional_info,
      s.id as series_id,
      s.name as series_name,
      uf.added_at as favorite_date,
      up.position,
      up.completed,
      up.last_played
    FROM user_favorites uf
    JOIN episodes e ON uf.episode_id = e.id
    JOIN series s ON e.series_id = s.id
    LEFT JOIN user_progress up ON e.id = up.episode_id AND up.user_id = ?
    WHERE uf.user_id = ? AND s.active = 1
  `;
  
  const params = [userId, userId];
  
  // Dodaj wyszukiwanie jeśli podano
  if (search) {
    query += ` AND (e.title LIKE ? OR e.additional_info LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ` ORDER BY s.name ASC, e.date_added DESC`;
  
  db.all(query, params, async (err, episodes) => {
    if (err) {
      console.error('Błąd pobierania ulubionych:', err);
      return res.status(500).json({ error: 'Błąd pobierania ulubionych odcinków' });
    }
    
    // Pobierz preferencje użytkownika
    const userPrefs = await new Promise((resolve) => {
      db.get('SELECT preferences FROM users WHERE id = ?', [userId], (err, user) => {
        resolve(JSON.parse(user?.preferences || '{}'));
      });
    });
    
    // Dodaj informacje o plikach audio i tematach
    for (const episode of episodes) {
      // Sprawdź język użytkownika
      const userLang = userPrefs.audioLanguage || 'polski';
      
      // Sprawdź czy plik audio istnieje
      const audioPath = path.join(__dirname, '../../../public/audio', 
        `seria${episode.series_id}`, userLang, episode.filename);
      
      try {
        await fs.access(audioPath);
        episode.audioUrl = `/audio/seria${episode.series_id}/${userLang}/${episode.filename}`;
      } catch {
        episode.audioUrl = null;
      }
      
      // Sprawdź czy plik z tematami istnieje
      const linksPath = path.join(__dirname, '../../../public/arkusze', 
        `seria${episode.series_id}`, episode.filename.replace('.mp3', '.txt'));
      
      try {
        const linksContent = await fs.readFile(linksPath, 'utf-8');
        episode.topics = parseLinksFile(linksContent);
      } catch {
        episode.topics = [];
      }
      
      // Określ status
      if (episode.completed) {
        episode.status = 'completed';
      } else if (episode.position > 0) {
        episode.status = 'inProgress';
      } else {
        episode.status = 'new';
      }
    }
    
    // Grupuj po seriach
    const grouped = episodes.reduce((acc, episode) => {
      if (!acc[episode.series_name]) {
        acc[episode.series_name] = {
          series_id: episode.series_id,
          series_name: episode.series_name,
          episodes: []
        };
      }
      acc[episode.series_name].episodes.push(episode);
      return acc;
    }, {});
    
    // Konwertuj do tablicy i posortuj alfabetycznie
    const result = Object.values(grouped).sort((a, b) => 
      a.series_name.localeCompare(b.series_name)
    );
    
    res.json(result);
  });
});

// Pobierz wszystkie odcinki (dla statystyk, eksportu itp.)
router.get('/all', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { includeCompleted = true } = req.query;
  
  let query = `
    SELECT 
      e.id,
      e.title,
      e.filename,
      e.additional_info,
      e.date_added,
      e.series_id,
      s.name as series_name,
      s.color as series_color,
      up.position,
      up.completed,
      up.last_played,
      uf.added_at as is_favorite
    FROM episodes e
    JOIN series s ON e.series_id = s.id
    LEFT JOIN user_progress up ON e.id = up.episode_id AND up.user_id = ?
    LEFT JOIN user_favorites uf ON e.id = uf.episode_id AND uf.user_id = ?
    WHERE s.active = 1
  `;
  
  const params = [userId, userId];
  
  // Opcjonalnie wykluczenie ukończonych
  if (includeCompleted === 'false') {
    query += ` AND (up.completed IS NULL OR up.completed = 0)`;
  }
  
  query += ` ORDER BY e.date_added DESC`;
  
  db.all(query, params, (err, episodes) => {
    if (err) {
      console.error('Error fetching all episodes:', err);
      return res.status(500).json({ error: 'Błąd pobierania odcinków' });
    }
    
    // Dodaj informacje o statusie
    episodes.forEach(episode => {
      if (episode.completed) {
        episode.status = 'completed';
      } else if (episode.position > 0) {
        episode.status = 'inProgress';
      } else {
        episode.status = 'new';
      }
      
      // Konwertuj is_favorite na boolean
      episode.is_favorite = !!episode.is_favorite;
    });
    
    res.json({
      episodes: episodes || [],
      total: episodes?.length || 0,
      stats: {
        new: episodes.filter(e => e.status === 'new').length,
        inProgress: episodes.filter(e => e.status === 'inProgress').length,
        completed: episodes.filter(e => e.status === 'completed').length,
        favorites: episodes.filter(e => e.is_favorite).length
      }
    });
  });
});

// ENDPOINT SEARCH - MUSI BYĆ PRZED /:id !!! 
router.get('/search', authenticateToken, async (req, res) => {
  console.log('🔍 Search endpoint called!');
  console.log('🔍 Full URL:', req.url);
  console.log('🔍 Query params:', req.query);
  console.log('🔍 User:', req.user?.id);
  
  const { q, series_id, date_from, date_to } = req.query;
  const userId = req.user.id;
  
  // Jeśli brak zapytania, zwróć pusty wynik
  if (!q || q.trim() === '') {
    return res.json({ episodes: [], total: 0 });
  }
  
  try {
    // Buduj zapytanie SQL - szukaj we WSZYSTKICH odcinkach
    let query = `
      SELECT 
        e.id,
        e.title,
        e.filename,
        e.additional_info,
        e.date_added,
        e.series_id,
        s.name as series_name,
        s.color as series_color,
        up.position,
        up.completed,
        up.last_played,
        uf.added_at as is_favorite
      FROM episodes e
      JOIN series s ON e.series_id = s.id
      LEFT JOIN user_progress up ON e.id = up.episode_id AND up.user_id = ?
      LEFT JOIN user_favorites uf ON e.id = uf.episode_id AND uf.user_id = ?
      WHERE s.active = 1
    `;
    
    const params = [userId, userId];
    
    // Dodaj wyszukiwanie w tytule i opisie
    query += ` AND (e.title LIKE ? OR e.additional_info LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`);
    
    // Filtr serii
    if (series_id && series_id !== 'all') {
      query += ` AND e.series_id = ?`;
      params.push(series_id);
    }
    
    // Filtr daty od
    if (date_from) {
      query += ` AND DATE(e.date_added) >= DATE(?)`;
      params.push(date_from);
    }
    
    // Filtr daty do
    if (date_to) {
      query += ` AND DATE(e.date_added) <= DATE(?)`;
      params.push(date_to);
    }
    
    // Sortowanie - najnowsze najpierw
    query += ` ORDER BY e.date_added DESC`;
    
    console.log('Executing search query:', query);
    console.log('With params:', params);
    
    db.all(query, params, (err, episodes) => {
      if (err) {
        console.error('Search query error:', err);
        return res.status(500).json({ error: 'Błąd wyszukiwania', details: err.message });
      }
      
      console.log(`Found ${episodes.length} episodes`);
      
      // Zwróć wyniki
      res.json({
        episodes: episodes || [],
        total: episodes?.length || 0
      });
    });
    
  } catch (error) {
    console.error('Search endpoint error:', error);
    res.status(500).json({ error: 'Błąd wyszukiwania', details: error.message });
  }
});

// Pobierz szczegóły odcinka - MUSI BYĆ PO /search !!!
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const language = req.query.language || 'polski';
  
  db.get(
    `SELECT e.*, s.name as series_name, s.id as series_id,
     uf.added_at as is_favorite,
     ur.rating as user_rating,
     (SELECT COUNT(*) + 1 FROM episodes e2 
      WHERE e2.series_id = e.series_id 
      AND e2.date_added < e.date_added) as episode_number
     FROM episodes e
     JOIN series s ON e.series_id = s.id
     LEFT JOIN user_favorites uf ON e.id = uf.episode_id AND uf.user_id = ?
     LEFT JOIN ratings ur ON e.id = ur.episode_id AND ur.user_id = ?
     WHERE e.id = ? AND s.active = 1`,
    [req.user.id, req.user.id, id],
    async (err, episode) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd pobierania odcinka' });
      }
      if (!episode) {
        return res.status(404).json({ error: 'Odcinek nie znaleziony' });
      }
      
      // Pobierz pozycję użytkownika
      db.get(
        `SELECT position FROM user_progress WHERE user_id = ? AND episode_id = ?`,
        [req.user.id, id],
        async (err, progress) => {
          if (!err && progress) {
            episode.user_position = progress.position;
          }
          
          // Sprawdź czy plik audio istnieje
          const audioPath = path.join(__dirname, '../../../public/audio', 
            `seria${episode.series_id}`, language, episode.filename);
          
          try {
            await fs.access(audioPath);
            episode.audioUrl = `/audio/seria${episode.series_id}/${language}/${episode.filename}`;
          } catch {
            episode.audioUrl = null;
          }
          
          // Sprawdź czy plik z linkami istnieje
          const linksPath = path.join(__dirname, '../../../public/arkusze', 
            `seria${episode.series_id}`, episode.filename.replace('.mp3', '.txt'));
          
          try {
            const linksContent = await fs.readFile(linksPath, 'utf-8');
            episode.topics = parseLinksFile(linksContent);
          } catch {
            episode.topics = [];
          }
          
          // Konwertuj is_favorite do boolean
          episode.is_favorite = !!episode.is_favorite;
          
          res.json(episode);
        }
      );
    }
  );
});

// Dodaj nowy odcinek (tylko admin)
router.post('/', authenticateToken, requireAdmin, upload.single('audio'), async (req, res) => {
  const { title, series_id, language = 'polski', additional_info = '' } = req.body;
  
  if (!title || !series_id || !req.file) {
    return res.status(400).json({ error: 'Tytuł, seria i plik audio są wymagane' });
  }
  
  db.run(
    `INSERT INTO episodes (series_id, title, filename, additional_info) VALUES (?, ?, ?, ?)`,
    [series_id, title, req.file.filename, additional_info],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Błąd tworzenia odcinka' });
      }
      
      res.status(201).json({
        id: this.lastID,
        title,
        series_id,
        filename: req.file.filename,
        additional_info,
        audioUrl: `/audio/seria${series_id}/${language}/${req.file.filename}`
      });
    }
  );
});

// Upload pliku z linkami (tylko admin)
router.post('/:id/links', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Zawartość pliku jest wymagana' });
  }
  
  // Pobierz informacje o odcinku
  db.get(
    `SELECT e.*, s.id as series_id FROM episodes e 
     JOIN series s ON e.series_id = s.id 
     WHERE e.id = ?`,
    [id],
    async (err, episode) => {
      if (err || !episode) {
        return res.status(404).json({ error: 'Odcinek nie znaleziony' });
      }
      
      // Zapisz plik
      const dir = path.join(__dirname, '../../../public/arkusze', `seria${episode.series_id}`);
      await fs.mkdir(dir, { recursive: true });
      
      const filename = episode.filename.replace('.mp3', '.txt');
      const filepath = path.join(dir, filename);
      
      await fs.writeFile(filepath, content, 'utf-8');
      
      res.json({ 
        message: 'Plik z linkami zapisany',
        topics: parseLinksFile(content)
      });
    }
  );
});

// Funkcja parsująca plik z linkami
function parseLinksFile(content) {
  const lines = content.split('\n');
  const topics = [];
  let currentTopic = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Sprawdź czy to timestamp z tytułem
    const timestampMatch = trimmed.match(/^\[(\d+):(\d+)\]\s*#?\s*(.+)$/);
    if (timestampMatch) {
      if (currentTopic) {
        topics.push(currentTopic);
      }
      
      const minutes = parseInt(timestampMatch[1]);
      const seconds = parseInt(timestampMatch[2]);
      currentTopic = {
        timestamp: minutes * 60 + seconds,
        title: timestampMatch[3].trim(),
        links: []
      };
    }
    // Sprawdź czy to link
    else if (trimmed.startsWith('http') || trimmed.startsWith('-')) {
      if (currentTopic) {
        const link = trimmed.startsWith('-') ? trimmed.substring(1).trim() : trimmed;
        if (link.startsWith('http')) {
          currentTopic.links.push(link);
        }
      }
    }
  }
  
  // Dodaj ostatni temat
  if (currentTopic) {
    topics.push(currentTopic);
  }
  
  return topics;
}

// Aktualizuj postęp odtwarzania
router.post('/:id/progress', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { position, completed } = req.body;
  const userId = req.user.id;
  
  try {
    // Inicjalizuj statystyki użytkownika jeśli nie istnieją
    await initializeUserStats(userId);
    
    // Zapisz postęp
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO user_progress (user_id, episode_id, position, completed, last_played)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [userId, id, position || 0, completed ? 1 : 0],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Sprawdź i przyznaj osiągnięcia
    if (completed) {
      await checkAndAwardAchievements(userId);
    }
    
    res.json({ message: 'Postęp zapisany' });
  } catch (error) {
    console.error('Błąd podczas zapisywania postępu:', error);
    res.status(500).json({ error: 'Błąd zapisywania postępu' });
  }
});

// Aktualizuj odcinek (tylko admin)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { title, additional_info } = req.body;
  
  const updates = [];
  const values = [];
  
  if (title !== undefined) {
    updates.push('title = ?');
    values.push(title);
  }
  
  if (additional_info !== undefined) {
    updates.push('additional_info = ?');
    values.push(additional_info);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'Brak danych do aktualizacji' });
  }
  
  values.push(id);
  
  db.run(
    `UPDATE episodes SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Błąd aktualizacji odcinka' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Odcinek nie znaleziony' });
      }
      
      res.json({ message: 'Odcinek zaktualizowany' });
    }
  );
});

// Dodaj/usuń z ulubionych
router.post('/:id/favorite', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Sprawdź czy już jest w ulubionych
  db.get(
    `SELECT * FROM user_favorites WHERE user_id = ? AND episode_id = ?`,
    [userId, id],
    (err, favorite) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd sprawdzania ulubionych' });
      }
      
      if (favorite) {
        // Usuń z ulubionych
        db.run(
          `DELETE FROM user_favorites WHERE user_id = ? AND episode_id = ?`,
          [userId, id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Błąd usuwania z ulubionych' });
            }
            res.json({ message: 'Usunięto z ulubionych', isFavorite: false });
          }
        );
      } else {
        // Dodaj do ulubionych
        db.run(
          `INSERT INTO user_favorites (user_id, episode_id) VALUES (?, ?)`,
          [userId, id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Błąd dodawania do ulubionych' });
            }
            res.json({ message: 'Dodano do ulubionych', isFavorite: true });
          }
        );
      }
    }
  );
});

// Usuń odcinek (tylko admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  // Najpierw pobierz informacje o odcinku
  db.get(
    `SELECT e.*, s.id as series_id FROM episodes e 
     JOIN series s ON e.series_id = s.id 
     WHERE e.id = ?`,
    [id],
    async (err, episode) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd pobierania odcinka' });
      }
      
      if (!episode) {
        return res.status(404).json({ error: 'Odcinek nie znaleziony' });
      }
      
      // Usuń powiązane dane
      db.serialize(() => {
        // Usuń postęp użytkowników
        db.run(`DELETE FROM user_progress WHERE episode_id = ?`, [id]);
        
        // Usuń z ulubionych
        db.run(`DELETE FROM user_favorites WHERE episode_id = ?`, [id]);
        
        // Usuń oceny
        db.run(`DELETE FROM ratings WHERE episode_id = ?`, [id]);
        
        // Usuń komentarze
        db.run(`DELETE FROM comments WHERE episode_id = ?`, [id]);
        
        // Usuń odcinek
        db.run(
          `DELETE FROM episodes WHERE id = ?`,
          [id],
          async function(err) {
            if (err) {
              return res.status(500).json({ error: 'Błąd usuwania odcinka' });
            }
            
            // Opcjonalnie usuń pliki
            try {
              // Usuń plik audio
              const audioDir = path.join(__dirname, '../../../public/audio', `seria${episode.series_id}`);
              const audioFiles = await fs.readdir(audioDir);
              for (const lang of ['polski', 'angielski', 'francuski']) {
                const audioPath = path.join(audioDir, lang, episode.filename);
                try {
                  await fs.unlink(audioPath);
                } catch (e) {
                  // Plik może nie istnieć w tym języku
                }
              }
              
              // Usuń plik z linkami
              const linksPath = path.join(__dirname, '../../../public/arkusze', 
                `seria${episode.series_id}`, episode.filename.replace('.mp3', '.txt'));
              try {
                await fs.unlink(linksPath);
              } catch (e) {
                // Plik może nie istnieć
              }
            } catch (error) {
              console.error('Błąd usuwania plików:', error);
              // Kontynuuj mimo błędu - odcinek już usunięty z bazy
            }
            
            res.json({ message: 'Odcinek usunięty' });
          }
        );
      });
    }
  );
});

// Pobierz ocenę użytkownika dla odcinka
router.get('/:id/rating', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  db.get(
    `SELECT rating FROM ratings WHERE user_id = ? AND episode_id = ?`,
    [userId, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd pobierania oceny' });
      }
      res.json({ rating: result ? result.rating : 0 });
    }
  );
});

// Dodaj/aktualizuj ocenę odcinka
router.post('/:id/rating', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  const userId = req.user.id;
  
  // Walidacja oceny
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Ocena musi być między 1 a 5' });
  }
  
  // Użyj UPSERT (INSERT OR REPLACE) dla lepszej wydajności
  db.run(
    `INSERT OR REPLACE INTO ratings (user_id, episode_id, rating, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    [userId, id, rating],
    function(err) {
      if (err) {
        console.error('Błąd zapisywania oceny:', err);
        return res.status(500).json({ error: 'Błąd zapisywania oceny' });
      }
      
      const message = this.changes > 0 ? 'Ocena dodana' : 'Ocena zaktualizowana';
      res.json({ message, rating });
    }
  );
});

// Pobierz średnią ocenę odcinka
router.get('/:id/average-rating', (req, res) => {
  const { id } = req.params;
  
  db.get(
    `SELECT 
      AVG(rating) as average_rating,
      COUNT(*) as rating_count
     FROM ratings 
     WHERE episode_id = ?`,
    [id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd pobierania średniej oceny' });
      }
      res.json({
        averageRating: result.average_rating ? parseFloat(result.average_rating.toFixed(1)) : 0,
        ratingCount: result.rating_count || 0
      });
    }
  );
});

// Pobierz najwyżej oceniane odcinki użytkownika
router.get('/my/top-rated', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  db.all(
    `SELECT 
      e.id,
      e.title,
      e.filename,
      e.date_added,
      s.name as series_name,
      s.color as series_color,
      r.rating,
      up.position,
      up.completed
     FROM episodes e
     JOIN series s ON e.series_id = s.id
     JOIN ratings r ON e.id = r.episode_id
     LEFT JOIN user_progress up ON e.id = up.episode_id AND up.user_id = ?
     WHERE r.user_id = ? AND s.active = 1
     ORDER BY r.rating DESC, e.date_added DESC
     LIMIT 20`,
    [userId, userId],
    (err, episodes) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd pobierania ocenionych odcinków' });
      }
      res.json(episodes);
    }
  );
});

export default router;