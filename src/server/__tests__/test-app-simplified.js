import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createTestApp() {
  const app = express();
  const upload = multer({ storage: multer.memoryStorage() });

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(cors());
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(limiter);

  const state = {
    users: [
      {
        id: 1,
        email: 'admin@food4thought.local',
        password: 'admin',
        role: 'super_admin',
        email_verified: true,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        email: 'test@example.com',
        password: 'test123',
        role: 'user',
        email_verified: true,
        created_at: '2024-01-02T00:00:00Z',
      },
    ],
    tokens: new Map([
      ['admin-token', 1],
      ['user-token', 2],
    ]),
    nextUserId: 3,

    series: [
      {
        id: 1,
        name: 'Test Series 1',
        color: '#ff0000',
        image: 'test1.jpg',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        name: 'Test Series 2',
        color: '#00ff00',
        image: 'test2.jpg',
        active: true,
        created_at: '2024-01-02T00:00:00Z',
      },
    ],
    nextSeriesId: 3,

    episodes: [
      {
        id: 1,
        series_id: 1,
        title: 'Test Episode',
        filename: 'episode1.mp3',
        language: 'polski',
        additional_info: 'Test description',
        date_added: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        series_id: 1,
        title: 'In Progress Episode',
        filename: 'episode2.mp3',
        language: 'polski',
        additional_info: '',
        date_added: '2024-01-02T00:00:00Z',
      },
      {
        id: 3,
        series_id: 2,
        title: 'Completed Episode',
        filename: 'episode3.mp3',
        language: 'polski',
        additional_info: '',
        date_added: '2024-01-03T00:00:00Z',
      },
    ],
    nextEpisodeId: 4,

    userFavorites: new Map([[2, new Set([1])]]),
    userRatings: new Map([
      ['2:1', { rating: 5, rated_at: '2024-01-01T00:00:00Z' }],
    ]),
    userProgress: new Map([
      ['2:2', { position: 300, completed: 0, last_played: '2024-01-01T00:00:00Z' }],
      ['2:3', { position: 1800, completed: 1, last_played: '2024-01-01T00:00:00Z' }],
    ]),
    episodeTopics: new Map(),
  };
  const protectedSeriesIds = new Set([1, 2]);
  const protectedEpisodeIds = new Set([1, 2, 3]);

  const parseIntSafe = (value) => {
    const parsed = parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : null;
  };

  const getSeriesById = (seriesId) => state.series.find((series) => series.id === seriesId);
  const getEpisodeById = (episodeId) => state.episodes.find((episode) => episode.id === episodeId);
  const isAdminRole = (role) => role === 'admin' || role === 'super_admin';

  const issueToken = (user) => {
    if (user.id === 1) {
      state.tokens.set('admin-token', user.id);
      return 'admin-token';
    }

    if (user.id === 2) {
      state.tokens.set('user-token', user.id);
      return 'user-token';
    }

    const dynamicToken = `user-token-${user.id}`;
    state.tokens.set(dynamicToken, user.id);
    return dynamicToken;
  };

  const getAuthUser = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return null;
    }

    const token = authHeader.split(' ')[1];
    const userId = state.tokens.get(token);
    if (!userId) {
      res.status(401).json({ error: 'Invalid token' });
      return null;
    }

    const user = state.users.find((item) => item.id === userId);
    if (!user) {
      res.status(401).json({ error: 'Invalid token' });
      return null;
    }

    return { token, user };
  };

  const requireAuth = (req, res, next) => {
    const auth = getAuthUser(req, res);
    if (!auth) {
      return;
    }

    req.auth = auth;
    next();
  };

  const requireAdmin = (req, res, next) => {
    const auth = getAuthUser(req, res);
    if (!auth) {
      return;
    }

    if (!isAdminRole(auth.user.role)) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    req.auth = auth;
    next();
  };

  const getUserSet = (map, userId) => {
    if (!map.has(userId)) {
      map.set(userId, new Set());
    }

    return map.get(userId);
  };

  const getUserProgress = (userId, episodeId) => {
    return state.userProgress.get(`${userId}:${episodeId}`) || {
      position: 0,
      completed: 0,
      last_played: null,
    };
  };

  const getUserRating = (userId, episodeId) => {
    const item = state.userRatings.get(`${userId}:${episodeId}`);
    return item || null;
  };

  const toAudioUrl = (episode) => `/audio/seria${episode.series_id}/polski/${episode.filename}`;

  const toEpisodeResponse = (episode, userId) => {
    const series = getSeriesById(episode.series_id);
    const progress = userId ? getUserProgress(userId, episode.id) : { position: 0, completed: 0, last_played: null };
    const rating = userId ? getUserRating(userId, episode.id) : null;
    const favoriteSet = userId ? getUserSet(state.userFavorites, userId) : new Set();
    const isFavorite = userId ? favoriteSet.has(episode.id) : false;

    return {
      ...episode,
      series_name: series?.name || 'Unknown Series',
      series_color: series?.color || '#3B82F6',
      series_image: series?.image || null,
      user_position: progress.position,
      user_completed: progress.completed,
      user_last_played: progress.last_played,
      position: progress.position,
      completed: progress.completed === 1,
      user_rating: rating ? rating.rating : null,
      rated_at: rating ? rating.rated_at : null,
      is_favorite: isFavorite,
      audioUrl: toAudioUrl(episode),
    };
  };

  const getEpisodeAverage = (episodeId) => {
    const ratings = [];
    for (const [key, value] of state.userRatings.entries()) {
      if (key.endsWith(`:${episodeId}`)) {
        ratings.push(value.rating);
      }
    }

    if (ratings.length === 0) {
      return { average_rating: 0, rating_count: 0 };
    }

    const sum = ratings.reduce((acc, item) => acc + item, 0);
    return {
      average_rating: sum / ratings.length,
      rating_count: ratings.length,
    };
  };

  const removeEpisodeReferences = (episodeId) => {
    for (const favorites of state.userFavorites.values()) {
      favorites.delete(episodeId);
    }

    for (const key of [...state.userRatings.keys()]) {
      if (key.endsWith(`:${episodeId}`)) {
        state.userRatings.delete(key);
      }
    }

    for (const key of [...state.userProgress.keys()]) {
      if (key.endsWith(`:${episodeId}`)) {
        state.userProgress.delete(key);
      }
    }

    state.episodeTopics.delete(episodeId);
  };

  const getEpisodeCountForSeries = (seriesId) => {
    return state.episodes.filter((episode) => episode.series_id === seriesId).length;
  };

  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Food 4 Thought API działa!' });
  });

  app.get('/api/test-db', (req, res) => {
    res.json({ result: 1 });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const user = state.users.find((item) => item.email === email && item.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = issueToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
      },
    });
  });

  app.post('/api/auth/register', (req, res) => {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Email, hasło i potwierdzenie hasła są wymagane' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Hasła nie są identyczne' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Hasło nie spełnia wymagań bezpieczeństwa',
        details: ['Hasło musi mieć minimum 8 znaków'],
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        error: 'Hasło nie spełnia wymagań bezpieczeństwa',
        details: ['Hasło musi zawierać przynajmniej jedną wielką literę'],
      });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({
        error: 'Hasło nie spełnia wymagań bezpieczeństwa',
        details: ['Hasło musi zawierać przynajmniej jedną małą literę'],
      });
    }

    if (!/\d/.test(password)) {
      return res.status(400).json({
        error: 'Hasło nie spełnia wymagań bezpieczeństwa',
        details: ['Hasło musi zawierać przynajmniej jedną cyfrę'],
      });
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      return res.status(400).json({
        error: 'Hasło nie spełnia wymagań bezpieczeństwa',
        details: ['Hasło musi zawierać przynajmniej jeden znak specjalny'],
      });
    }

    if (state.users.some((item) => item.email === email)) {
      return res.status(400).json({ error: 'Użytkownik o tym emailu już istnieje' });
    }

    const newUser = {
      id: state.nextUserId++,
      email,
      password,
      role: 'user',
      email_verified: true,
      created_at: new Date().toISOString(),
    };

    state.users.push(newUser);
    state.userFavorites.set(newUser.id, new Set());

    return res.status(201).json({
      message: 'Konto zostało utworzone. Sprawdź swój email, aby potwierdzić adres.',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        email_verified: false,
      },
    });
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    const { user } = req.auth;

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
    });
  });

  app.post('/api/auth/logout', requireAuth, (req, res) => {
    res.json({ message: 'Logged out successfully' });
  });

  app.post('/api/auth/refresh', requireAuth, (req, res) => {
    const { token, user } = req.auth;

    if (token === 'invalid-token') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const newToken = token.endsWith('-refreshed') ? token : `${token}-refreshed`;
    state.tokens.set(newToken, user.id);

    return res.json({
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  });

  app.get('/api/series', requireAuth, (req, res) => {
    const result = state.series
      .filter((series) => series.active !== false)
      .map((series) => ({
        ...series,
        episode_count: getEpisodeCountForSeries(series.id),
      }));

    res.json(result);
  });

  app.get('/api/series/:id', requireAuth, (req, res) => {
    const seriesId = parseIntSafe(req.params.id);
    const series = state.series.find((item) => item.id === seriesId);

    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }

    return res.json({
      ...series,
      episode_count: getEpisodeCountForSeries(series.id),
    });
  });

  app.delete('/api/series/:id', requireAdmin, (req, res) => {
    const seriesId = parseIntSafe(req.params.id);
    const index = state.series.findIndex((item) => item.id === seriesId);

    if (index === -1) {
      return res.status(404).json({ error: 'Series not found' });
    }

    if (!protectedSeriesIds.has(seriesId)) {
      state.series.splice(index, 1);
      state.episodes = state.episodes.filter((episode) => episode.series_id !== seriesId);
    }

    return res.json({ message: 'Series deleted successfully' });
  });

  app.get('/api/episodes/my', requireAuth, (req, res) => {
    const userId = req.auth.user.id;
    const grouped = {
      new: [],
      inProgress: [],
      completed: [],
    };

    for (const episode of state.episodes) {
      const payload = toEpisodeResponse(episode, userId);

      if (payload.user_completed === 1) {
        grouped.completed.push(payload);
      } else if (payload.user_position > 0) {
        grouped.inProgress.push(payload);
      } else {
        grouped.new.push(payload);
      }
    }

    return res.json(grouped);
  });

  app.get('/api/episodes/favorites', requireAuth, (req, res) => {
    const userId = req.auth.user.id;
    const search = String(req.query.search || '').toLowerCase();
    const favoriteIds = getUserSet(state.userFavorites, userId);

    let favorites = state.episodes
      .filter((episode) => favoriteIds.has(episode.id))
      .map((episode) => {
        const item = toEpisodeResponse(episode, userId);
        item.favorited_at = '2024-01-01T00:00:00Z';
        return item;
      });

    if (search) {
      favorites = favorites.filter((episode) => {
        const title = String(episode.title || '').toLowerCase();
        const seriesName = String(episode.series_name || '').toLowerCase();
        return title.includes(search) || seriesName.includes(search);
      });
    }

    return res.json(favorites);
  });

  app.get('/api/episodes/my/top-rated', requireAuth, (req, res) => {
    const userId = req.auth.user.id;
    const results = [];

    for (const [key, ratingData] of state.userRatings.entries()) {
      const [ownerIdRaw, episodeIdRaw] = key.split(':');
      const ownerId = parseIntSafe(ownerIdRaw);
      const episodeId = parseIntSafe(episodeIdRaw);

      if (ownerId !== userId || !episodeId) {
        continue;
      }

      const episode = getEpisodeById(episodeId);
      if (!episode) {
        continue;
      }

      const item = toEpisodeResponse(episode, userId);
      results.push({
        id: item.id,
        series_id: item.series_id,
        title: item.title,
        filename: item.filename,
        series_name: item.series_name,
        series_color: item.series_color,
        series_image: item.series_image,
        rating: ratingData.rating,
        rated_at: ratingData.rated_at,
        audioUrl: item.audioUrl,
      });
    }

    results.sort((a, b) => b.rating - a.rating);

    return res.json(results);
  });

  app.get('/api/episodes/next/:id', requireAuth, (req, res) => {
    const currentEpisodeId = parseIntSafe(req.params.id);
    const currentEpisode = getEpisodeById(currentEpisodeId);

    if (!currentEpisode) {
      return res.status(404).json({ error: 'Current episode not found' });
    }

    let nextEpisode = state.episodes.find(
      (episode) => episode.series_id === currentEpisode.series_id && episode.id > currentEpisode.id
    );

    if (!nextEpisode) {
      nextEpisode = state.episodes.find((episode) => episode.id > currentEpisode.id) || null;
    }

    if (!nextEpisode) {
      return res.json({ nextEpisode: null, message: 'No next episode found' });
    }

    return res.json({
      nextEpisode: {
        ...toEpisodeResponse(nextEpisode, req.auth.user.id),
      },
      message: 'Next episode found',
    });
  });

  app.post('/api/episodes', requireAdmin, upload.single('audio'), (req, res) => {
    const title = String(req.body?.title || '').trim();
    const seriesId = parseIntSafe(req.body?.series_id);
    const language = String(req.body?.language || 'polski');
    const additionalInfo = String(req.body?.additional_info || '');

    if (!title || !seriesId) {
      return res.status(400).json({ error: 'Tytul i seria sa wymagane' });
    }

    if (!getSeriesById(seriesId)) {
      return res.status(404).json({ error: 'Seria nie znaleziona' });
    }

    const filename = req.file
      ? `${Date.now()}_${String(req.file.originalname || 'audio.mp3').replace(/[^a-zA-Z0-9.]/g, '_')}`
      : `episode_${Date.now()}.mp3`;

    const newEpisode = {
      id: state.nextEpisodeId++,
      series_id: seriesId,
      title,
      filename,
      language,
      additional_info: additionalInfo,
      date_added: new Date().toISOString(),
    };

    state.episodes.push(newEpisode);

    return res.status(201).json({
      message: req.file ? 'Odcinek utworzony pomyslnie z plikiem audio' : 'Odcinek utworzony (mozesz pozniej dodac plik audio)',
      episode: toEpisodeResponse(newEpisode, req.auth.user.id),
      hasAudioFile: !!req.file,
    });
  });

  app.post('/api/episodes/:id/upload-audio', requireAdmin, upload.single('audio'), (req, res) => {
    const episodeId = parseIntSafe(req.params.id);
    const episode = getEpisodeById(episodeId);

    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nie przeslano pliku audio' });
    }

    episode.filename = `${Date.now()}_${String(req.file.originalname || 'audio.mp3').replace(/[^a-zA-Z0-9.]/g, '_')}`;

    return res.json({
      message: 'Plik audio przeslany pomyslnie',
      episode: toEpisodeResponse(episode, req.auth.user.id),
    });
  });

  app.put('/api/episodes/:id', requireAdmin, (req, res) => {
    const episodeId = parseIntSafe(req.params.id);
    const episode = getEpisodeById(episodeId);

    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }

    const { title, series_id: seriesIdRaw, language, additional_info: additionalInfo, topics_content: topicsContent } = req.body;

    if (title !== undefined) {
      episode.title = String(title);
    }

    if (seriesIdRaw !== undefined) {
      const seriesId = parseIntSafe(seriesIdRaw);
      if (!seriesId) {
        return res.status(400).json({ error: 'Nieprawidłowe ID serii' });
      }
      if (!getSeriesById(seriesId)) {
        return res.status(404).json({ error: 'Nowa seria nie znaleziona' });
      }
      episode.series_id = seriesId;
    }

    if (language !== undefined) {
      episode.language = String(language);
    }

    if (additionalInfo !== undefined) {
      episode.additional_info = String(additionalInfo);
    }

    if (topicsContent !== undefined) {
      state.episodeTopics.set(episode.id, String(topicsContent));
    }

    return res.json({
      message: 'Odcinek zaktualizowany',
      episode: toEpisodeResponse(episode, req.auth.user.id),
    });
  });

  app.get('/api/episodes/:id/topics', requireAuth, (req, res) => {
    const episodeId = parseIntSafe(req.params.id);
    const episode = getEpisodeById(episodeId);

    if (!episode) {
      return res.status(404).json({ error: 'Odcinek nie znaleziony' });
    }

    const rawTopics = state.episodeTopics.get(episode.id) || '';
    const topics = rawTopics
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    return res.json({
      episodeId: episode.id,
      episodeTitle: episode.title,
      topics,
    });
  });

  app.get('/api/episodes/:id', requireAuth, (req, res) => {
    const episodeId = parseIntSafe(req.params.id);
    const episode = getEpisodeById(episodeId);

    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    const payload = toEpisodeResponse(episode, req.auth.user.id);
    const average = getEpisodeAverage(episode.id);

    return res.json({
      ...payload,
      average_rating: average.average_rating,
      rating_count: average.rating_count,
    });
  });

  app.post('/api/episodes/:id/progress', requireAuth, (req, res) => {
    const episodeId = parseIntSafe(req.params.id);
    const episode = getEpisodeById(episodeId);

    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    const position = Number(req.body?.position) || 0;
    const completed = req.body?.completed ? 1 : 0;

    state.userProgress.set(`${req.auth.user.id}:${episode.id}`, {
      position,
      completed,
      last_played: new Date().toISOString(),
    });

    return res.json({ message: 'Progress saved successfully' });
  });

  app.post('/api/episodes/:id/favorite', requireAuth, (req, res) => {
    const episodeId = parseIntSafe(req.params.id);
    const episode = getEpisodeById(episodeId);

    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    const favorites = getUserSet(state.userFavorites, req.auth.user.id);
    favorites.add(episode.id);

    return res.json({ message: 'Added to favorites', isFavorite: true });
  });

  app.delete('/api/episodes/:id/favorite', requireAuth, (req, res) => {
    const episodeId = parseIntSafe(req.params.id);
    const episode = getEpisodeById(episodeId);

    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    const favorites = getUserSet(state.userFavorites, req.auth.user.id);
    favorites.delete(episode.id);

    return res.json({ message: 'Removed from favorites', isFavorite: false });
  });

  app.post('/api/episodes/:id/rating', requireAuth, (req, res) => {
    const episodeId = parseIntSafe(req.params.id);
    const episode = getEpisodeById(episodeId);

    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    const rating = Number(req.body?.rating);
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating' });
    }

    state.userRatings.set(`${req.auth.user.id}:${episode.id}`, {
      rating,
      rated_at: new Date().toISOString(),
    });

    return res.json({ message: 'Rating saved successfully' });
  });

  app.get('/api/episodes/:id/rating', requireAuth, (req, res) => {
    const episodeId = parseIntSafe(req.params.id);
    const rating = getUserRating(req.auth.user.id, episodeId);

    return res.json({ rating: rating ? rating.rating : null });
  });

  app.get('/api/episodes/:id/average-rating', requireAuth, (req, res) => {
    const episodeId = parseIntSafe(req.params.id);
    const stats = getEpisodeAverage(episodeId);

    return res.json(stats);
  });

  app.delete('/api/episodes/:id', requireAdmin, (req, res) => {
    const episodeId = parseIntSafe(req.params.id);
    const index = state.episodes.findIndex((episode) => episode.id === episodeId);

    if (index === -1) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    // Stabilne dane fixture dla testów integracyjnych nie są fizycznie usuwane,
    // bo kolejne testy w tej samej suite dalej korzystają z odcinków 1-3.
    if (!protectedEpisodeIds.has(episodeId)) {
      state.episodes.splice(index, 1);
      removeEpisodeReferences(episodeId);
    }

    return res.json({ message: 'Episode deleted successfully' });
  });

  const requireSameUserOrAdmin = (req, res, next) => {
    const auth = getAuthUser(req, res);
    if (!auth) {
      return;
    }

    const targetUserId = parseIntSafe(req.params.id);
    if (!targetUserId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (!isAdminRole(auth.user.role) && auth.user.id !== targetUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.auth = auth;
    req.targetUserId = targetUserId;
    next();
  };

  app.get('/api/users/:id/stats', requireSameUserOrAdmin, (req, res) => {
    res.json({
      total_episodes: state.episodes.length,
      completed_episodes: [...state.userProgress.entries()].filter(
        ([key, value]) => key.startsWith(`${req.targetUserId}:`) && value.completed === 1
      ).length,
      favorite_episodes: getUserSet(state.userFavorites, req.targetUserId).size,
      total_listening_time: 3600,
      episodes_completed: [...state.userProgress.entries()].filter(
        ([key, value]) => key.startsWith(`${req.targetUserId}:`) && value.completed === 1
      ).length,
      achievements_earned: 3,
      avg_completion: 0.85,
      seriesStats: state.series.map((series) => ({
        id: series.id,
        name: series.name,
        color: series.color,
        totalCount: getEpisodeCountForSeries(series.id),
        completedCount: 1,
      })),
    });
  });

  app.get('/api/users/:id/favorites', requireSameUserOrAdmin, (req, res) => {
    const favorites = [...getUserSet(state.userFavorites, req.targetUserId)].map((episodeId) => {
      const episode = getEpisodeById(episodeId);
      if (!episode) {
        return null;
      }

      return {
        id: episode.id,
        title: episode.title,
        series_id: episode.series_id,
      };
    }).filter(Boolean);

    res.json(favorites);
  });

  app.get('/api/users/:id/history', requireSameUserOrAdmin, (req, res) => {
    res.json([
      {
        episode_id: 1,
        title: 'Episode 1',
        listened_at: '2024-01-01T00:00:00Z',
      },
    ]);
  });

  app.get('/api/users/:id/patterns', requireSameUserOrAdmin, (req, res) => {
    res.json({
      preferred_time: 'evening',
      preferred_duration: 30,
      preferred_series: [1, 2],
    });
  });

  app.get('/api/achievements', requireAuth, (req, res) => {
    res.json([
      {
        id: 1,
        name: 'First Episode',
        description: 'Listen to your first episode',
        progress: 100,
        category: 'episodes',
        completed: true,
      },
    ]);
  });

  app.post('/api/achievements/check', requireAuth, (req, res) => {
    res.json({ message: 'Achievements checked successfully' });
  });

  app.post('/api/achievements/record-session', requireAuth, (req, res) => {
    const { episodeId, startTime, endTime, playbackSpeed, completionRate, durationSeconds } = req.body;

    if (
      !episodeId ||
      !startTime ||
      !endTime ||
      playbackSpeed === undefined ||
      completionRate === undefined ||
      durationSeconds === undefined
    ) {
      return res.status(400).json({ error: 'Missing required session data' });
    }

    return res.json({ message: 'Session recorded successfully' });
  });

  app.get('/api/admin/stats', requireAdmin, (req, res) => {
    const totalUsers = state.users.length;
    const totalEpisodes = state.episodes.length;
    const totalSeries = state.series.length;

    return res.json({
      totalUsers,
      totalEpisodes,
      totalSeries,
      totalListeningTime: 36000,
      averageCompletionRate: 0.85,
      users: {
        total: totalUsers,
        active: Math.max(1, totalUsers - 1),
        retention: 0.8,
      },
      episodes: {
        total: totalEpisodes,
        publishedToday: 0,
      },
      series: {
        total: totalSeries,
        active: state.series.filter((item) => item.active !== false).length,
      },
      technical: {
        apiUptime: 99.9,
      },
    });
  });

  app.get('/api/admin/users', requireAdmin, (req, res) => {
    const payload = state.users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      email_verified: user.email_verified,
    }));

    res.json(payload);
  });

  app.put('/api/admin/users/:id', requireAdmin, (req, res) => {
    const userId = parseIntSafe(req.params.id);
    const user = state.users.find((item) => item.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Konto admina fixture nie jest mutowane między testami.
    if (req.body?.role && user.id !== 1) {
      user.role = req.body.role;
    }

    return res.json({ message: 'User updated successfully' });
  });

  app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
    const userId = parseIntSafe(req.params.id);

    if (userId === 1) {
      return res.json({ message: 'User deleted successfully' });
    }

    const index = state.users.findIndex((item) => item.id === userId);
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    state.users.splice(index, 1);

    for (const [token, mappedUserId] of [...state.tokens.entries()]) {
      if (mappedUserId === userId) {
        state.tokens.delete(token);
      }
    }

    return res.json({ message: 'User deleted successfully' });
  });

  app.get('/api/admin/users/activity', requireAdmin, (req, res) => {
    res.json([
      {
        userId: 1,
        lastActive: '2024-01-01T12:00:00Z',
        totalListeningTime: 3600,
        episodesCompleted: 5,
      },
      {
        userId: 2,
        lastActive: '2024-01-01T10:00:00Z',
        totalListeningTime: 1800,
        episodesCompleted: 3,
      },
    ]);
  });

  app.get('/api/admin/series', requireAdmin, (req, res) => {
    const payload = state.series.map((series) => ({
      ...series,
      episode_count: getEpisodeCountForSeries(series.id),
    }));

    res.json(payload);
  });

  app.get('/api/admin/series/:id', requireAdmin, (req, res) => {
    const seriesId = parseIntSafe(req.params.id);
    const series = state.series.find((item) => item.id === seriesId);

    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }

    return res.json({
      ...series,
      episode_count: getEpisodeCountForSeries(series.id),
    });
  });

  app.post('/api/admin/series', requireAdmin, upload.none(), (req, res) => {
    const name = String(req.body?.name || 'New Admin Series').trim() || 'New Admin Series';

    const series = {
      id: state.nextSeriesId++,
      name,
      color: String(req.body?.color || '#0000ff'),
      image: req.body?.image || null,
      active: true,
      created_at: new Date().toISOString(),
    };

    state.series.push(series);

    return res.status(201).json({ series });
  });

  app.put('/api/admin/series/:id', requireAdmin, upload.none(), (req, res) => {
    const seriesId = parseIntSafe(req.params.id);
    const series = state.series.find((item) => item.id === seriesId);

    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }

    if (req.body?.name !== undefined) {
      series.name = String(req.body.name);
    }

    if (req.body?.color !== undefined) {
      series.color = String(req.body.color);
    }

    return res.json({ message: 'Series updated successfully' });
  });

  app.delete('/api/admin/series/:id', requireAdmin, (req, res) => {
    const seriesId = parseIntSafe(req.params.id);
    const index = state.series.findIndex((item) => item.id === seriesId);

    if (index === -1) {
      return res.status(404).json({ error: 'Series not found' });
    }

    if (!protectedSeriesIds.has(seriesId)) {
      state.series.splice(index, 1);
      state.episodes = state.episodes.filter((episode) => episode.series_id !== seriesId);
    }

    return res.json({ message: 'Series deleted successfully' });
  });

  app.get('/api/admin/episodes', requireAdmin, (req, res) => {
    const payload = state.episodes.map((episode) => ({
      ...episode,
      audioUrl: toAudioUrl(episode),
    }));

    res.json(payload);
  });

  app.post('/api/admin/episodes', requireAdmin, upload.none(), (req, res) => {
    const title = String(req.body?.title || 'New Admin Episode');
    const seriesId = parseIntSafe(req.body?.series_id) || 1;

    const episode = {
      id: state.nextEpisodeId++,
      title,
      series_id: seriesId,
      filename: `episode${state.nextEpisodeId}.mp3`,
      language: 'polski',
      additional_info: String(req.body?.additional_info || ''),
      date_added: new Date().toISOString(),
    };

    state.episodes.push(episode);

    return res.status(201).json({ episode });
  });

  app.put('/api/admin/episodes/:id', requireAdmin, upload.none(), (req, res) => {
    const episodeId = parseIntSafe(req.params.id);
    const episode = getEpisodeById(episodeId);

    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    if (req.body?.title !== undefined) {
      episode.title = String(req.body.title);
    }

    if (req.body?.series_id !== undefined) {
      const seriesId = parseIntSafe(req.body.series_id);
      if (seriesId) {
        episode.series_id = seriesId;
      }
    }

    if (req.body?.additional_info !== undefined) {
      episode.additional_info = String(req.body.additional_info);
    }

    return res.json({ message: 'Episode updated successfully' });
  });

  app.delete('/api/admin/episodes/:id', requireAdmin, (req, res) => {
    const episodeId = parseIntSafe(req.params.id);
    const index = state.episodes.findIndex((episode) => episode.id === episodeId);

    if (index === -1) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    if (!protectedEpisodeIds.has(episodeId)) {
      state.episodes.splice(index, 1);
      removeEpisodeReferences(episodeId);
    }

    return res.json({ message: 'Episode deleted successfully' });
  });

  app.get('/api/admin-stats/stats', requireAdmin, (req, res) => {
    res.json({
      total_users: state.users.length,
      total_episodes: state.episodes.length,
      total_series: state.series.length,
    });
  });

  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  return app;
}

export const app = createTestApp();
export default app;

import { test, expect } from '@jest/globals';

test('test app should be properly exported', () => {
  expect(app).toBeDefined();
  expect(typeof app.listen).toBe('function');
});
