import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seriesImagesDir = path.join(__dirname, '../../public/series-images');

const getPublicImagePath = (filename) => `/series-images/${filename}`;

const getLocalImageFilename = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return null;
  if (!imagePath.startsWith('/series-images/')) return null;
  const filename = path.basename(imagePath);
  if (!filename || filename.includes('..') || filename.includes('/')) return null;
  return filename;
};

const removeSeriesImageIfLocal = async (imagePath) => {
  const filename = getLocalImageFilename(imagePath);
  if (!filename) return;
  const absolutePath = path.join(seriesImagesDir, filename);
  try {
    await fs.promises.unlink(absolutePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Remove series image error:', error);
    }
  }
};

const imageStorage = multer.diskStorage({
  destination(req, file, cb) {
    try {
      fs.mkdirSync(seriesImagesDir, { recursive: true });
      cb(null, seriesImagesDir);
    } catch (error) {
      cb(error);
    }
  },
  filename(req, file, cb) {
    const timestamp = Date.now();
    const safeBase = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'series';
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${safeBase}-${timestamp}${ext}`);
  }
});

const uploadSeriesImage = multer({
  storage: imageStorage,
  fileFilter(req, file, cb) {
    const allowedExt = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
    const ext = path.extname(file.originalname).toLowerCase();
    if ((file.mimetype || '').startsWith('image/') && allowedExt.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Dozwolone są tylko pliki graficzne JPG/PNG/WEBP/GIF'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const parseActiveValue = (value) => {
  if (value === undefined || value === null) return undefined;
  if (value === true || value === 'true' || value === 1 || value === '1') return 1;
  if (value === false || value === 'false' || value === 0 || value === '0') return 0;
  return undefined;
};

// Pobierz wszystkie serie
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const activeCondition = isAdmin ? '' : 'WHERE s.active = 1';
    const series = await db.all(`
      SELECT 
        s.id,
        s.name,
        s.active,
        s.created_at,
        s.image,
        s.color,
        COUNT(e.id) as episode_count
      FROM series s
      LEFT JOIN episodes e ON e.series_id = s.id
      ${activeCondition}
      GROUP BY s.id, s.name, s.active, s.created_at, s.image, s.color
      ORDER BY s.name
    `);
    res.json(series);
  } catch (error) {
    console.error('Get series error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Dodaj serię (admin only)
router.post('/', authenticateToken, requireAdmin, uploadSeriesImage.single('image'), async (req, res) => {
  let uploadedImagePath = null;
  try {
    const db = await getDb();
    const name = (req.body.name || '').trim();
    const color = (req.body.color || '#3B82F6').trim();

    if (!name) {
      if (req.file) {
        await removeSeriesImageIfLocal(getPublicImagePath(req.file.filename));
      }
      return res.status(400).json({ error: 'Nazwa serii jest wymagana' });
    }

    const existing = await db.get('SELECT id FROM series WHERE lower(name) = lower(?)', [name]);
    if (existing) {
      if (req.file) {
        await removeSeriesImageIfLocal(getPublicImagePath(req.file.filename));
      }
      return res.status(400).json({ error: 'Seria o tej nazwie już istnieje' });
    }

    if (req.file) {
      uploadedImagePath = getPublicImagePath(req.file.filename);
    }

    const result = await db.run(
      'INSERT INTO series (name, color, image, active) VALUES (?, ?, ?, 1)',
      [name, color, uploadedImagePath]
    );

    const created = await db.get(`
      SELECT 
        s.id,
        s.name,
        s.active,
        s.created_at,
        s.image,
        s.color,
        COUNT(e.id) as episode_count
      FROM series s
      LEFT JOIN episodes e ON e.series_id = s.id
      WHERE s.id = ?
      GROUP BY s.id, s.name, s.active, s.created_at, s.image, s.color
    `, [result.lastID]);

    res.status(201).json(created);
  } catch (error) {
    if (uploadedImagePath) {
      await removeSeriesImageIfLocal(uploadedImagePath);
    }
    console.error('Create series error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Dodaj serię do preferencji użytkownika
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const seriesId = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);

    if (!Number.isInteger(seriesId) || seriesId <= 0) {
      return res.status(400).json({ error: 'Nieprawidłowe ID serii' });
    }

    const series = await db.get('SELECT id FROM series WHERE id = ? AND active = 1', [seriesId]);
    if (!series) {
      return res.status(404).json({ error: 'Seria nie znaleziona' });
    }

    const user = await db.get('SELECT preferences FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    let preferences = {};
    try {
      const parsed = JSON.parse(user.preferences || '{}');
      preferences = parsed.preferences || parsed;
    } catch (error) {
      preferences = {};
    }

    let activeSeries = preferences.activeSeries;
    if (activeSeries === 'all' || !Array.isArray(activeSeries)) {
      activeSeries = [];
    }

    if (!activeSeries.includes(seriesId)) {
      activeSeries.push(seriesId);
    }

    preferences.activeSeries = activeSeries;

    await db.run('UPDATE users SET preferences = ? WHERE id = ?', [
      JSON.stringify(preferences),
      userId
    ]);

    res.json({ message: 'Seria dodana do preferowanych', activeSeries });
  } catch (error) {
    console.error('Favorite series error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz serię po ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const seriesId = parseInt(req.params.id);
    
    const series = await db.get(`
      SELECT 
        s.*,
        COUNT(e.id) as episode_count
      FROM series s
      LEFT JOIN episodes e ON e.series_id = s.id
      WHERE s.id = ?
      GROUP BY s.id, s.name, s.active, s.created_at, s.image, s.color
    `, [seriesId]);
    
    if (!series) {
      return res.status(404).json({ error: 'Seria nie znaleziona' });
    }
    
    res.json(series);
  } catch (error) {
    console.error('Get series error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Aktualizuj serię (admin only)
router.put('/:id', authenticateToken, requireAdmin, uploadSeriesImage.single('image'), async (req, res) => {
  try {
    const db = await getDb();
    const seriesId = parseInt(req.params.id, 10);
    const { name, color, removeImage } = req.body;
    const active = parseActiveValue(req.body.active);

    if (!Number.isInteger(seriesId) || seriesId <= 0) {
      return res.status(400).json({ error: 'Nieprawidłowe ID serii' });
    }

    const existing = await db.get('SELECT * FROM series WHERE id = ?', [seriesId]);
    if (!existing) {
      if (req.file) {
        await removeSeriesImageIfLocal(getPublicImagePath(req.file.filename));
      }
      return res.status(404).json({ error: 'Seria nie znaleziona' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        if (req.file) {
          await removeSeriesImageIfLocal(getPublicImagePath(req.file.filename));
        }
        return res.status(400).json({ error: 'Nazwa serii jest wymagana' });
      }

      const duplicate = await db.get(
        'SELECT id FROM series WHERE lower(name) = lower(?) AND id != ?',
        [trimmedName, seriesId]
      );
      if (duplicate) {
        if (req.file) {
          await removeSeriesImageIfLocal(getPublicImagePath(req.file.filename));
        }
        return res.status(400).json({ error: 'Seria o tej nazwie już istnieje' });
      }

      updates.push('name = ?');
      values.push(trimmedName);
    }

    if (color !== undefined) {
      updates.push('color = ?');
      values.push((color || '#3B82F6').trim());
    }

    if (active !== undefined) {
      updates.push('active = ?');
      values.push(active);
    }

    let shouldDeleteOldImage = false;
    let newImagePath = null;

    if (removeImage === 'true' || removeImage === true) {
      updates.push('image = NULL');
      shouldDeleteOldImage = true;
    } else if (req.file) {
      newImagePath = getPublicImagePath(req.file.filename);
      updates.push('image = ?');
      values.push(newImagePath);
      shouldDeleteOldImage = true;
    }

    if (updates.length > 0) {
      values.push(seriesId);
      await db.run(`UPDATE series SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    if (shouldDeleteOldImage && existing.image && existing.image !== newImagePath) {
      await removeSeriesImageIfLocal(existing.image);
    }

    const updated = await db.get(`
      SELECT 
        s.id,
        s.name,
        s.active,
        s.created_at,
        s.image,
        s.color,
        COUNT(e.id) as episode_count
      FROM series s
      LEFT JOIN episodes e ON e.series_id = s.id
      WHERE s.id = ?
      GROUP BY s.id, s.name, s.active, s.created_at, s.image, s.color
    `, [seriesId]);

    res.json(updated);
  } catch (error) {
    if (req.file) {
      await removeSeriesImageIfLocal(getPublicImagePath(req.file.filename));
    }
    console.error('Update series error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Usuń serię (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const seriesId = parseInt(req.params.id);
    
    // Sprawdź czy seria istnieje
    const series = await db.get('SELECT * FROM series WHERE id = ?', [seriesId]);
    if (!series) {
      return res.status(404).json({ error: 'Seria nie znaleziona' });
    }
    
    // Usuń wszystkie powiązane dane
    await db.run('DELETE FROM user_favorites WHERE episode_id IN (SELECT id FROM episodes WHERE series_id = ?)', [seriesId]);
    await db.run('DELETE FROM ratings WHERE episode_id IN (SELECT id FROM episodes WHERE series_id = ?)', [seriesId]);
    await db.run('DELETE FROM listening_sessions WHERE episode_id IN (SELECT id FROM episodes WHERE series_id = ?)', [seriesId]);
    await db.run('DELETE FROM episodes WHERE series_id = ?', [seriesId]);
    await db.run('DELETE FROM series WHERE id = ?', [seriesId]);

    await removeSeriesImageIfLocal(series.image);
    
    res.json({ message: 'Seria usunięta' });
  } catch (error) {
    console.error('Delete series error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
