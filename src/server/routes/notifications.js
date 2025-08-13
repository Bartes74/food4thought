import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import getDb from '../database.js';

const router = express.Router();

// GET /api/notifications - Pobierz aktywne powiadomienia dla użytkownika
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;

    // Pobierz aktywne powiadomienia, które użytkownik jeszcze nie odrzucił
    const notifications = await db.all(`
      SELECT 
        an.id,
        an.title,
        an.message,
        an.created_at,
        an.updated_at,
        COALESCE(ns.views_count, 0) as views_count,
        COALESCE(ns.dismissed, 0) as dismissed,
        ns.dismissed_at,
        ns.first_viewed_at,
        ns.last_viewed_at
      FROM admin_notifications an
      LEFT JOIN notification_stats ns ON an.id = ns.notification_id AND ns.user_id = ?
      WHERE an.is_active = 1
      ORDER BY an.created_at DESC
    `, [userId]);

    // Filtruj powiadomienia - pokazuj tylko te, które użytkownik nie odrzucił
    const activeNotifications = notifications.filter(n => !n.dismissed);

    res.json(activeNotifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/notifications/:id/view - Zarejestruj wyświetlenie powiadomienia
router.post('/:id/view', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;

    // Sprawdź czy powiadomienie istnieje i jest aktywne
    const notification = await db.get(`
      SELECT id FROM admin_notifications 
      WHERE id = ? AND is_active = 1
    `, [notificationId]);

    if (!notification) {
      return res.status(404).json({ error: 'Powiadomienie nie znalezione' });
    }

    // Sprawdź czy użytkownik już odrzucił to powiadomienie
    const existingStats = await db.get(`
      SELECT * FROM notification_stats 
      WHERE notification_id = ? AND user_id = ?
    `, [notificationId, userId]);

    if (existingStats && existingStats.dismissed) {
      return res.status(400).json({ error: 'Powiadomienie zostało już odrzucone' });
    }

    const now = new Date().toISOString();

    if (existingStats) {
      // Aktualizuj istniejące statystyki
      await db.run(`
        UPDATE notification_stats 
        SET views_count = views_count + 1, last_viewed_at = ?
        WHERE notification_id = ? AND user_id = ?
      `, [now, notificationId, userId]);
    } else {
      // Utwórz nowe statystyki
      await db.run(`
        INSERT INTO notification_stats 
        (notification_id, user_id, views_count, first_viewed_at, last_viewed_at)
        VALUES (?, ?, 1, ?, ?)
      `, [notificationId, userId, now, now]);
    }

    res.json({ message: 'Wyświetlenie zarejestrowane' });
  } catch (error) {
    console.error('View notification error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/notifications/:id/dismiss - Odrzuć powiadomienie (nie pokazuj więcej)
router.post('/:id/dismiss', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;

    // Sprawdź czy powiadomienie istnieje
    const notification = await db.get(`
      SELECT id FROM admin_notifications 
      WHERE id = ? AND is_active = 1
    `, [notificationId]);

    if (!notification) {
      return res.status(404).json({ error: 'Powiadomienie nie znalezione' });
    }

    const now = new Date().toISOString();

    // Sprawdź czy statystyki już istnieją
    const existingStats = await db.get(`
      SELECT * FROM notification_stats 
      WHERE notification_id = ? AND user_id = ?
    `, [notificationId, userId]);

    if (existingStats) {
      // Aktualizuj istniejące statystyki
      await db.run(`
        UPDATE notification_stats 
        SET dismissed = 1, dismissed_at = ?
        WHERE notification_id = ? AND user_id = ?
      `, [now, notificationId, userId]);
    } else {
      // Utwórz nowe statystyki z odrzuceniem
      await db.run(`
        INSERT INTO notification_stats 
        (notification_id, user_id, views_count, dismissed, dismissed_at, first_viewed_at, last_viewed_at)
        VALUES (?, ?, 0, 1, ?, ?, ?)
      `, [notificationId, userId, now, now, now]);
    }

    res.json({ message: 'Powiadomienie odrzucone' });
  } catch (error) {
    console.error('Dismiss notification error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ADMIN ENDPOINTS

// GET /api/notifications/admin - Pobierz wszystkie powiadomienia (admin)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();

    const notifications = await db.all(`
      SELECT 
        an.id,
        an.title,
        an.message,
        an.is_active,
        an.created_at,
        an.updated_at,
        u.email as created_by_email,
        COUNT(ns.id) as total_users,
        SUM(CASE WHEN ns.dismissed = 1 THEN 1 ELSE 0 END) as dismissed_count,
        SUM(ns.views_count) as total_views
      FROM admin_notifications an
      LEFT JOIN users u ON an.created_by = u.id
      LEFT JOIN notification_stats ns ON an.id = ns.notification_id
      GROUP BY an.id
      ORDER BY an.created_at DESC
    `);

    res.json(notifications);
  } catch (error) {
    console.error('Get admin notifications error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/notifications/admin - Utwórz nowe powiadomienie (admin)
router.post('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { title, message } = req.body;
    const createdBy = req.user.id;

    if (!title || !message) {
      return res.status(400).json({ error: 'Tytuł i treść są wymagane' });
    }

    const result = await db.run(`
      INSERT INTO admin_notifications (title, message, created_by)
      VALUES (?, ?, ?)
    `, [title, message, createdBy]);

    const newNotification = await db.get(`
      SELECT 
        an.id,
        an.title,
        an.message,
        an.is_active,
        an.created_at,
        an.updated_at,
        u.email as created_by_email
      FROM admin_notifications an
      LEFT JOIN users u ON an.created_by = u.id
      WHERE an.id = ?
    `, [result.lastID]);

    res.status(201).json(newNotification);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// PUT /api/notifications/admin/:id - Edytuj powiadomienie (admin)
router.put('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const notificationId = parseInt(req.params.id);
    const { title, message, is_active } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Tytuł i treść są wymagane' });
    }

    const now = new Date().toISOString();

    await db.run(`
      UPDATE admin_notifications 
      SET title = ?, message = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `, [title, message, is_active ? 1 : 0, now, notificationId]);

    const updatedNotification = await db.get(`
      SELECT 
        an.id,
        an.title,
        an.message,
        an.is_active,
        an.created_at,
        an.updated_at,
        u.email as created_by_email
      FROM admin_notifications an
      LEFT JOIN users u ON an.created_by = u.id
      WHERE an.id = ?
    `, [notificationId]);

    if (!updatedNotification) {
      return res.status(404).json({ error: 'Powiadomienie nie znalezione' });
    }

    res.json(updatedNotification);
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// DELETE /api/notifications/admin/:id - Usuń powiadomienie (admin)
router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const notificationId = parseInt(req.params.id);

    const result = await db.run(`
      DELETE FROM admin_notifications WHERE id = ?
    `, [notificationId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Powiadomienie nie znalezione' });
    }

    res.json({ message: 'Powiadomienie usunięte' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/notifications/admin/:id/stats - Pobierz szczegółowe statystyki powiadomienia (admin)
router.get('/admin/:id/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const notificationId = parseInt(req.params.id);

    // Sprawdź czy powiadomienie istnieje
    const notification = await db.get(`
      SELECT id, title FROM admin_notifications WHERE id = ?
    `, [notificationId]);

    if (!notification) {
      return res.status(404).json({ error: 'Powiadomienie nie znalezione' });
    }

    // Pobierz szczegółowe statystyki
    const stats = await db.all(`
      SELECT 
        ns.*,
        u.email as user_email,
        u.created_at as user_created_at
      FROM notification_stats ns
      LEFT JOIN users u ON ns.user_id = u.id
      WHERE ns.notification_id = ?
      ORDER BY ns.created_at DESC
    `, [notificationId]);

    // Podsumowanie statystyk
    const summary = {
      total_users: stats.length,
      total_views: stats.reduce((sum, s) => sum + s.views_count, 0),
      dismissed_count: stats.filter(s => s.dismissed).length,
      active_users: stats.filter(s => !s.dismissed).length,
      average_views: stats.length > 0 ? (stats.reduce((sum, s) => sum + s.views_count, 0) / stats.length).toFixed(2) : 0
    };

    res.json({
      notification: {
        id: notification.id,
        title: notification.title
      },
      summary,
      details: stats
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;
