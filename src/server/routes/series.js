import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import db from '../database.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfiguracja multer dla grafik serii
const seriesImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../../public/series-images');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'series-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadSeriesImage = multer({ 
  storage: seriesImageStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Pobierz wszystkie serie (dla zalogowanych użytkowników)
router.get('/', authenticateToken, (req, res) => {
  // Pokazuj wszystkie serie adminowi, filtruj według preferencji dla zwykłych użytkowników
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
  const userId = req.user.id;
  
  // Najpierw pobierz preferencje użytkownika
  db.get(
    `SELECT preferences FROM users WHERE id = ?`,
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd pobierania preferencji' });
      }
      
      const preferences = JSON.parse(user?.preferences || '{}');
      const activeSeries = preferences.activeSeries || 'all';
      
      // Buduj zapytanie
      let query = `
        SELECT s.*, COUNT(DISTINCT e.id) as episode_count 
        FROM series s 
        LEFT JOIN episodes e ON s.id = e.series_id
      `;
      
      const params = [];
      const conditions = [];
      
      // Admin widzi wszystko, użytkownik tylko aktywne
      if (!isAdmin) {
        conditions.push('s.active = 1');
      }
      
      // Filtruj według wybranych serii (tylko dla zwykłych użytkowników)
      if (!isAdmin && activeSeries !== 'all' && Array.isArray(activeSeries) && activeSeries.length > 0) {
        const seriesIds = activeSeries.map(id => parseInt(id)).filter(id => !isNaN(id));
        if (seriesIds.length > 0) {
          conditions.push(`s.id IN (${seriesIds.map(() => '?').join(',')})`);
          params.push(...seriesIds);
        }
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' GROUP BY s.id ORDER BY s.name';
      
      db.all(query, params, (err, series) => {
        if (err) {
          console.error('Błąd pobierania serii:', err);
          return res.status(500).json({ error: 'Błąd pobierania serii' });
        }
        res.json(series);
      });
    }
  );
});

// Pobierz szczegóły serii z odcinkami
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
  
  // Najpierw pobierz serię
  db.get(
    `SELECT * FROM series WHERE id = ? ${isAdmin ? '' : 'AND active = 1'}`,
    [id],
    (err, series) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd pobierania serii' });
      }
      if (!series) {
        return res.status(404).json({ error: 'Seria nie znaleziona' });
      }
      
      // Pobierz odcinki dla tej serii
      db.all(
        `SELECT e.*, 
         COUNT(DISTINCT r.user_id) as rating_count,
         AVG(r.rating) as average_rating,
         COUNT(DISTINCT uf.user_id) as favorite_count,
         MAX(CASE WHEN up.user_id = ? THEN up.completed ELSE 0 END) as is_completed,
         MAX(CASE WHEN up.user_id = ? THEN up.position ELSE 0 END) as user_position,
         MAX(CASE WHEN uf.user_id = ? THEN 1 ELSE 0 END) as is_favorite
         FROM episodes e
         LEFT JOIN ratings r ON e.id = r.episode_id
         LEFT JOIN user_favorites uf ON e.id = uf.episode_id
         LEFT JOIN user_progress up ON e.id = up.episode_id
         WHERE e.series_id = ?
         GROUP BY e.id
         ORDER BY e.date_added DESC`,
        [req.user.id, req.user.id, req.user.id, id],
        (err, episodes) => {
          if (err) {
            return res.status(500).json({ error: 'Błąd pobierania odcinków' });
          }
          
          res.json({
            ...series,
            episodes
          });
        }
      );
    }
  );
});

// Utwórz nową serię (tylko admin)
router.post('/', [authenticateToken, requireAdmin, uploadSeriesImage.single('image')], (req, res) => {
  const { name, color = '#3B82F6' } = req.body;
  const image = req.file ? `/series-images/${req.file.filename}` : null;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Nazwa serii jest wymagana' });
  }
  
  // Najpierw sprawdź czy seria już istnieje
  db.get(
    `SELECT * FROM series WHERE name = ?`,
    [name.trim()],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd sprawdzania serii' });
      }
      
      if (existing) {
        // Usuń przesłany plik jeśli seria już istnieje
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: 'Seria o tej nazwie już istnieje' });
      }
      
      // Dodaj nową serię
      db.run(
        `INSERT INTO series (name, color, image) VALUES (?, ?, ?)`,
        [name.trim(), color, image],
        function(err) {
          if (err) {
            // Usuń przesłany plik w przypadku błędu
            if (req.file) {
              fs.unlinkSync(req.file.path);
            }
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ error: 'Seria o tej nazwie już istnieje' });
            }
            return res.status(500).json({ error: 'Błąd tworzenia serii' });
          }
          
          res.status(201).json({
            id: this.lastID,
            name: name.trim(),
            active: true,
            created_at: new Date().toISOString(),
            episode_count: 0,
            color,
            image
          });
        }
      );
    }
  );
});

// Aktualizuj serię (tylko admin)
router.put('/:id', [authenticateToken, requireAdmin, uploadSeriesImage.single('image')], (req, res) => {
  const { id } = req.params;
  const { name, active, color, removeImage } = req.body;
  
  if (name !== undefined && name.trim().length === 0) {
    return res.status(400).json({ error: 'Nazwa serii nie może być pusta' });
  }
  
  // Najpierw pobierz aktualną serię
  db.get(
    `SELECT * FROM series WHERE id = ?`,
    [id],
    (err, currentSeries) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd pobierania serii' });
      }
      
      if (!currentSeries) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ error: 'Seria nie znaleziona' });
      }
      
      // Sprawdź czy nowa nazwa nie koliduje z inną serią
      if (name !== undefined) {
        db.get(
          `SELECT * FROM series WHERE name = ? AND id != ?`,
          [name.trim(), id],
          (err, existing) => {
            if (err) {
              if (req.file) {
                fs.unlinkSync(req.file.path);
              }
              return res.status(500).json({ error: 'Błąd sprawdzania nazwy' });
            }
            
            if (existing) {
              if (req.file) {
                fs.unlinkSync(req.file.path);
              }
              return res.status(400).json({ error: 'Seria o tej nazwie już istnieje' });
            }
            
            // Kontynuuj aktualizację
            updateSeries();
          }
        );
      } else {
        updateSeries();
      }
      
      function updateSeries() {
        let newImage = currentSeries.image;
        
        // Obsługa usuwania grafiki
        if (removeImage === 'true') {
          // Usuń starą grafikę
          if (currentSeries.image) {
            const oldImagePath = path.join(__dirname, '../../../public', currentSeries.image);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
          newImage = null;
        } 
        // Obsługa nowej grafiki
        else if (req.file) {
          // Usuń starą grafikę jeśli istnieje
          if (currentSeries.image) {
            const oldImagePath = path.join(__dirname, '../../../public', currentSeries.image);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
          newImage = `/series-images/${req.file.filename}`;
        }
        
        // Buduj zapytanie dynamicznie
        const updates = [];
        const values = [];
        
        if (name !== undefined) {
          updates.push('name = ?');
          values.push(name.trim());
        }
        
        if (active !== undefined) {
          updates.push('active = ?');
          values.push(active ? 1 : 0);
        }
        
        if (color !== undefined) {
          updates.push('color = ?');
          values.push(color);
        }
        
        updates.push('image = ?');
        values.push(newImage);
        
        values.push(id);
        
        db.run(
          `UPDATE series SET ${updates.join(', ')} WHERE id = ?`,
          values,
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Błąd aktualizacji serii' });
            }
            
            if (this.changes === 0) {
              return res.status(404).json({ error: 'Seria nie znaleziona' });
            }
            
            res.json({ message: 'Seria zaktualizowana' });
          }
        );
      }
    }
  );
});

// Usuń serię (tylko admin)
router.delete('/:id', [authenticateToken, requireAdmin], (req, res) => {
  const { id } = req.params;
  
  // Sprawdź czy seria ma odcinki
  db.get(
    `SELECT COUNT(*) as count FROM episodes WHERE series_id = ?`,
    [id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Błąd sprawdzania odcinków' });
      }
      
      if (result.count > 0) {
        return res.status(400).json({ 
          error: 'Nie można usunąć serii która ma odcinki. Najpierw usuń wszystkie odcinki.' 
        });
      }
      
      // Pobierz serię żeby usunąć grafikę
      db.get(
        `SELECT image FROM series WHERE id = ?`,
        [id],
        (err, series) => {
          if (err) {
            return res.status(500).json({ error: 'Błąd pobierania serii' });
          }
          
          // Usuń serię
          db.run(
            `DELETE FROM series WHERE id = ?`,
            [id],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Błąd usuwania serii' });
              }
              
              if (this.changes === 0) {
                return res.status(404).json({ error: 'Seria nie znaleziona' });
              }
              
              // Usuń grafikę jeśli istnieje
              if (series && series.image) {
                const imagePath = path.join(__dirname, '../../../public', series.image);
                if (fs.existsSync(imagePath)) {
                  fs.unlinkSync(imagePath);
                }
              }
              
              res.json({ message: 'Seria usunięta' });
            }
          );
        }
      );
    }
  );
});

export default router;