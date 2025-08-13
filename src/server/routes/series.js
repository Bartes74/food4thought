import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Pobierz wszystkie serie
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const series = await db.all('SELECT id, name, active, created_at, image, color FROM series WHERE active = 1 ORDER BY name');
    res.json(series);
  } catch (error) {
    console.error('Get series error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz serię po ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const seriesId = parseInt(req.params.id);
    
    const series = await db.get('SELECT * FROM series WHERE id = ?', [seriesId]);
    
    if (!series) {
      return res.status(404).json({ error: 'Seria nie znaleziona' });
    }
    
    res.json(series);
  } catch (error) {
    console.error('Get series error:', error);
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
    
    res.json({ message: 'Seria usunięta' });
  } catch (error) {
    console.error('Delete series error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;