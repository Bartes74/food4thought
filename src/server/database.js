import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { verbose } = sqlite3;
const SQLite3 = verbose();

// Ścieżka do pliku bazy danych
const dbPath = path.join(__dirname, '../../food4thought.db');

// Utworzenie połączenia z bazą
const db = new SQLite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Błąd połączenia z bazą danych:', err);
  } else {
    console.log('✅ Połączono z bazą danych SQLite');
  }
});

// Włączenie foreign keys
db.run('PRAGMA foreign_keys = ON');

// Inicjalizacja tabel
const initDatabase = () => {
  db.serialize(() => {
    // Tabela użytkowników
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        preferences TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        email_verified BOOLEAN DEFAULT 1
      )
    `);

    // Tabela resetowania haseł
    db.run(`
      CREATE TABLE IF NOT EXISTS password_resets (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Tabela serii
    db.run(`
      CREATE TABLE IF NOT EXISTS series (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        image TEXT,
        color TEXT DEFAULT '#3B82F6'
      )
    `);

    // Dodanie kolumn image i color do istniejących tabel
    db.run(`
      ALTER TABLE series 
      ADD COLUMN image TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.log('Kolumna image już istnieje lub inny błąd:', err);
      } else if (!err) {
        console.log('✅ Dodano kolumnę image do tabeli series');
      }
    });

    db.run(`
      ALTER TABLE series 
      ADD COLUMN color TEXT DEFAULT '#3B82F6'
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.log('Kolumna color już istnieje lub inny błąd:', err);
      } else if (!err) {
        console.log('✅ Dodano kolumnę color do tabeli series');
        
        // Aktualizuj istniejące serie z domyślnymi kolorami
        db.run(`
          UPDATE series SET color = CASE
            WHEN name LIKE '%Biznes%' THEN '#3B82F6'
            WHEN name LIKE '%Technologia%' OR name LIKE '%Technolog%' THEN '#10B981'
            WHEN name LIKE '%Nauka%' OR name LIKE '%Nauk%' THEN '#8B5CF6'
            WHEN name LIKE '%Historia%' OR name LIKE '%Histor%' THEN '#EF4444'
            WHEN name LIKE '%Marketing%' THEN '#F59E0B'
            WHEN name LIKE '%Zdrowie%' THEN '#EC4899'
            WHEN name LIKE '%Kultura%' THEN '#14B8A6'
            WHEN name LIKE '%Sport%' THEN '#84CC16'
            ELSE '#3B82F6'
          END WHERE color IS NULL OR color = '#3B82F6'
        `);
      }
    });

    // Tabela odcinków
    db.run(`
      CREATE TABLE IF NOT EXISTS episodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        series_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        filename TEXT NOT NULL,
        date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
        average_rating REAL DEFAULT 0,
        additional_info TEXT DEFAULT '',
        FOREIGN KEY (series_id) REFERENCES series(id)
      )
    `);

    // Dodaj kolumnę additional_info jeśli nie istnieje (dla istniejących baz)
    db.run(`
      ALTER TABLE episodes 
      ADD COLUMN additional_info TEXT DEFAULT ''
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.log('Kolumna additional_info już istnieje lub inny błąd:', err);
      } else if (!err) {
        console.log('✅ Dodano kolumnę additional_info do tabeli episodes');
      }
    });

    // Usuń duplikaty serii i dodaj UNIQUE constraint
    db.serialize(() => {
      // Najpierw usuń duplikaty - zostaw tylko pierwsze wystąpienie każdej nazwy
      db.run(`
        DELETE FROM series 
        WHERE id NOT IN (
          SELECT MIN(id) 
          FROM series 
          GROUP BY name
        )
      `, (err) => {
        if (!err) {
          console.log('✅ Usunięto duplikaty serii');
        }
      });

      // Spróbuj dodać UNIQUE constraint (może się nie udać jeśli już istnieje)
      db.run(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_series_name ON series(name)
      `, (err) => {
        if (!err) {
          console.log('✅ Dodano UNIQUE constraint na nazwę serii');
        }
      });
    });

    // Tabela postępu użytkownika
    db.run(`
      CREATE TABLE IF NOT EXISTS user_progress (
        user_id INTEGER NOT NULL,
        episode_id INTEGER NOT NULL,
        position INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT 0,
        last_played DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, episode_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (episode_id) REFERENCES episodes(id)
      )
    `);

    // Tabela ulubionych
    db.run(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        user_id INTEGER NOT NULL,
        episode_id INTEGER NOT NULL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, episode_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (episode_id) REFERENCES episodes(id)
      )
    `);

    // Tabela ocen
    db.run(`
      CREATE TABLE IF NOT EXISTS ratings (
        user_id INTEGER NOT NULL,
        episode_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, episode_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (episode_id) REFERENCES episodes(id)
      )
    `);

    // Tabela komentarzy
    db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        episode_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        moderated BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (episode_id) REFERENCES episodes(id)
      )
    `);

    // Tabela komunikatów
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Tabela definicji osiągnięć
    db.run(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        icon TEXT NOT NULL,
        requirement_value INTEGER NOT NULL,
        requirement_type TEXT NOT NULL,
        points INTEGER DEFAULT 10,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela osiągnięć użytkowników
    db.run(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        user_id INTEGER NOT NULL,
        achievement_id INTEGER NOT NULL,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        progress_value INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT 0,
        PRIMARY KEY (user_id, achievement_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (achievement_id) REFERENCES achievements(id)
      )
    `);

    // Tabela statystyk użytkowników (dla trackingu osiągnięć)
    db.run(`
      CREATE TABLE IF NOT EXISTS user_stats (
        user_id INTEGER PRIMARY KEY,
        total_listening_time INTEGER DEFAULT 0,
        total_episodes_completed INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_listening_date DATE,
        fastest_completion_rate REAL DEFAULT 0,
        night_owl_sessions INTEGER DEFAULT 0,
        early_bird_sessions INTEGER DEFAULT 0,
        high_speed_listening_time INTEGER DEFAULT 0,
        perfect_completions INTEGER DEFAULT 0,
        daily_episodes_count INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Tabela sesji słuchania (dla trackingu wzorców czasowych)
    db.run(`
      CREATE TABLE IF NOT EXISTS listening_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        episode_id INTEGER NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        playback_speed REAL DEFAULT 1.0,
        completion_rate REAL DEFAULT 0,
        duration_seconds INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (episode_id) REFERENCES episodes(id)
      )
    `);

    // Utworzenie domyślnego super administratora
    const defaultPassword = 'admin123';
    bcrypt.hash(defaultPassword, 10, (err, hash) => {
      if (!err) {
        db.run(
          `INSERT OR IGNORE INTO users (email, password_hash, role) VALUES (?, ?, ?)`,
          ['admin@food4thought.local', hash, 'super_admin'],
          (err) => {
            if (!err) {
              console.log('✅ Utworzono domyślnego super administratora');
              console.log('📧 Email: admin@food4thought.local');
              console.log('🔑 Hasło: admin123');
              console.log('⚠️  ZMIEŃ TO HASŁO PO PIERWSZYM LOGOWANIU!');
            }
          }
        );
      }
    });
  });
};

// Inicjalizacja bazy danych
initDatabase();

// Inicjalizacja domyślnych osiągnięć
const initializeAchievements = () => {
  const achievements = [
    {
      name: 'Szybki Słuchacz',
      description: 'Słuchaj przez 1 godzinę z prędkością 2x',
      category: 'speed',
      icon: '⚡',
      requirement_value: 3600, // 1 godzina w sekundach
      requirement_type: 'high_speed_listening_time',
      points: 20
    },
    {
      name: 'Dokładny Słuchacz',
      description: 'Ukończ 10 odcinków z 95%+ dokładnością',
      category: 'precision',
      icon: '🎯',
      requirement_value: 10,
      requirement_type: 'perfect_completions',
      points: 30
    },
    {
      name: 'Nocny Marek',
      description: 'Słuchaj 5 odcinków między 22:00 a 6:00',
      category: 'patterns',
      icon: '🦉',
      requirement_value: 5,
      requirement_type: 'night_owl_sessions',
      points: 15
    },
    {
      name: 'Ranny Ptaszek',
      description: 'Słuchaj 5 odcinków między 6:00 a 10:00',
      category: 'patterns',
      icon: '🌅',
      requirement_value: 5,
      requirement_type: 'early_bird_sessions',
      points: 15
    },
    {
      name: 'Seria Mistrzowska',
      description: 'Słuchaj 7 dni z rzędu',
      category: 'streak',
      icon: '🔥',
      requirement_value: 7,
      requirement_type: 'current_streak',
      points: 50
    },
    {
      name: 'Codzienny Słuchacz',
      description: 'Słuchaj 5 odcinków w jeden dzień',
      category: 'daily',
      icon: '📅',
      requirement_value: 5,
      requirement_type: 'daily_episodes_count',
      points: 25
    }
  ];

  achievements.forEach(achievement => {
    db.run(`
      INSERT OR IGNORE INTO achievements 
      (name, description, category, icon, requirement_value, requirement_type, points)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [achievement.name, achievement.description, achievement.category, 
        achievement.icon, achievement.requirement_value, achievement.requirement_type, achievement.points]);
  });
  
  console.log('✅ Zainicjalizowano system osiągnięć');
};

// Inicjalizacja statystyk użytkownika
const initializeUserStats = (userId) => {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT OR IGNORE INTO user_stats (user_id)
      VALUES (?)
    `, [userId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Inicjalizacja osiągnięć po definicji funkcji
initializeAchievements();


export default db;