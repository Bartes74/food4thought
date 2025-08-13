import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

// Enable SQLite WAL mode for better concurrency
const SQLITE_BUSY_TIMEOUT = 5000; // 5 seconds

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize the database tables and schema
 * @param {import('sqlite').Database} db - Database connection
 * @returns {Promise<void>}
 */
async function initDatabase(db) {
  // Database version for migrations
  const DB_VERSION = 3;
  
  try {
    // Sprawdź wersję bazy danych
    const versionResult = await db.get('PRAGMA user_version');
    const currentVersion = versionResult ? versionResult.user_version : 0;

    // Migracje bazy danych
    if (currentVersion < 1) {
      // Tabela użytkowników
      await db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          preferences TEXT DEFAULT '{}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          email_verified BOOLEAN DEFAULT 0
        )
      `);

      // Tabela resetowania haseł
      await db.run(`
        CREATE TABLE IF NOT EXISTS password_resets (
          token TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          expires_at DATETIME NOT NULL,
          used BOOLEAN DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
    }

    // Migracja do wersji 2 - dodanie tabeli email_verifications
    if (currentVersion < 2) {
      // Tabela weryfikacji email
      await db.run(`
        CREATE TABLE IF NOT EXISTS email_verifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          used BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ Dodano tabelę email_verifications');
    }

    // Migracja do wersji 3 - dodanie systemu powiadomień administratorów
    if (currentVersion < 3) {
      // Tabela powiadomień administratorów
      await db.run(`
        CREATE TABLE IF NOT EXISTS admin_notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          created_by INTEGER NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Tabela statystyk powiadomień użytkowników
      await db.run(`
        CREATE TABLE IF NOT EXISTS notification_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          notification_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          views_count INTEGER DEFAULT 0,
          dismissed BOOLEAN DEFAULT 0,
          dismissed_at DATETIME,
          first_viewed_at DATETIME,
          last_viewed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (notification_id) REFERENCES admin_notifications(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(notification_id, user_id)
        )
      `);

      console.log('✅ Dodano system powiadomień administratorów');
    }

    // Tabela serii
    await db.run(`
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
    try {
      await db.run(`
        ALTER TABLE series 
        ADD COLUMN image TEXT
      `);
      console.log('✅ Dodano kolumnę image do tabeli series');
    } catch (error) {
      console.log('Kolumna image już istnieje w tabeli series');
    }

    try {
      await db.run(`
        ALTER TABLE series 
        ADD COLUMN color TEXT DEFAULT '#3B82F6'
      `);
      console.log('✅ Dodano kolumnę color do tabeli series');
    } catch (error) {
      console.log('Kolumna color już istnieje w tabeli series');
    }
      
    // Aktualizuj istniejące serie z domyślnymi kolorami
    await db.run(`
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

    // Najpierw usuń duplikaty - zostaw tylko pierwsze wystąpienie każdej nazwy
    await db.run(`
      DELETE FROM series 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM series 
        GROUP BY name
      )
    `);
    console.log('✅ Usunięto duplikaty serii');

    // Spróbuj dodać UNIQUE constraint
    await db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_series_name ON series(name)');
    console.log('✅ Dodano UNIQUE constraint na nazwę serii');
    
    // Zaktualizuj wersję bazy danych
    await db.run(`PRAGMA user_version = ${DB_VERSION}`);

    // Tabela odcinków
    await db.run(`
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
    try {
      await db.run(`
        ALTER TABLE episodes 
        ADD COLUMN additional_info TEXT DEFAULT ''
      `);
    } catch (error) {
      // Kolumna już istnieje, ignoruj błąd
      console.log('Kolumna additional_info już istnieje');
    }

    // Tabela ulubionych
    await db.run(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        user_id INTEGER NOT NULL,
        episode_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, episode_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
      )
    `);

    // Tabela ocen
    await db.run(`
      CREATE TABLE IF NOT EXISTS ratings (
        user_id INTEGER NOT NULL,
        episode_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, episode_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
      )
    `);

    // Tabela sesji odsłuchiwania
    await db.run(`
      CREATE TABLE IF NOT EXISTS listening_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        episode_id INTEGER NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        duration_seconds INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
      )
    `);

    // Tabela osiągnięć
    await db.run(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        criteria TEXT NOT NULL,
        points INTEGER NOT NULL DEFAULT 10,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela osiągnięć użytkownika
    await db.run(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        user_id INTEGER NOT NULL,
        achievement_id INTEGER NOT NULL,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, achievement_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
      )
    `);

    // Tabela statystyk użytkownika
    await db.run(`
      CREATE TABLE IF NOT EXISTS user_stats (
        user_id INTEGER PRIMARY KEY,
        total_listening_seconds INTEGER DEFAULT 0,
        episodes_completed INTEGER DEFAULT 0,
        achievements_earned INTEGER DEFAULT 0,
        last_active DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Dodaj indeksy dla lepszej wydajności zapytań
    await db.run('CREATE INDEX IF NOT EXISTS idx_episodes_series_id ON episodes(series_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_episodes_date_added ON episodes(date_added DESC)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_ratings_episode_id ON ratings(episode_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_ratings_user_episode ON ratings(user_id, episode_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_listening_sessions_user_episode ON listening_sessions(user_id, episode_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_user_progress_user_episode ON user_progress(user_id, episode_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_user_favorites_user_episode ON user_favorites(user_id, episode_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_series_active ON series(active)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_series_name ON series(name)');
    
    // Dodaj kolumnę created_at do listening_sessions jeśli nie istnieje
    try {
      await db.run(`
        ALTER TABLE listening_sessions 
        ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      `);
      await db.run('CREATE INDEX IF NOT EXISTS idx_listening_sessions_created_at ON listening_sessions(created_at)');
    } catch (error) {
      console.log('Kolumna created_at już istnieje w listening_sessions lub indeks już istnieje');
    }
    
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Inicjalizacja bazy danych
let dbInstance = null;
let initPromise = null;

/**
 * Gets a database connection instance
 * @returns {Promise<import('sqlite').Database>} Database instance
 */
export async function getDb() {
  // Jeśli dbInstance już istnieje, zwróć go bezpośrednio
  if (dbInstance) {
    return dbInstance;
  }
  
  if (!initPromise) {
    initPromise = (async () => {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const dbPath = path.join(__dirname, '..', '..', 'data', 'food4thought.db');

      dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });

      // Configure database for maximum performance
      await dbInstance.run('PRAGMA journal_mode = WAL');
      await dbInstance.run(`PRAGMA busy_timeout = ${SQLITE_BUSY_TIMEOUT}`);
      await dbInstance.run('PRAGMA foreign_keys = ON');
      await dbInstance.run('PRAGMA synchronous = NORMAL');
      await dbInstance.run('PRAGMA cache_size = 50000');
      await dbInstance.run('PRAGMA temp_store = MEMORY');
      await dbInstance.run('PRAGMA mmap_size = 268435456'); // 256MB
      await dbInstance.run('PRAGMA page_size = 4096');
      
      // Initialize database schema only if needed
      const versionResult = await dbInstance.get('PRAGMA user_version');
      const currentVersion = versionResult ? versionResult.user_version : 0;
      
      if (currentVersion < 3) {
        await initDatabase(dbInstance);
      }
      
      return dbInstance;
    })();
  }
  
  return initPromise;
}

// Initialize database when imported
export async function initializeDatabase() {
  const db = await getDb();
  await initializeAchievements(db);
  return db;
}

// For backward compatibility
const initDatabasePromise = initializeDatabase();

// Inicjalizacja domyślnych osiągnięć
const initializeAchievements = async (db) => {
  // Sprawdź czy osiągnięcia już istnieją
  const existingCount = await db.get('SELECT COUNT(*) as count FROM achievements');
  if (existingCount.count > 0) {
    console.log('✅ Osiągnięcia już zainicjalizowane, pomijam...');
    return;
  }

  const achievements = [
    {
      name: 'Szybki Słuchacz',
      description: 'Słuchaj przez 1 godzinę z prędkością 2x',
      icon: '⚡',
      criteria: 'high_speed_listening_time:3600',
      points: 20
    },
    {
      name: 'Dokładny Słuchacz',
      description: 'Ukończ 10 odcinków z 95%+ dokładnością',
      icon: '🎯',
      criteria: 'perfect_completions:10',
      points: 30
    },
    {
      name: 'Nocny Marek',
      description: 'Słuchaj 5 odcinków między 22:00 a 6:00',
      icon: '🦉',
      criteria: 'night_owl_sessions:5',
      points: 15
    },
    {
      name: 'Ranny Ptaszek',
      description: 'Słuchaj 5 odcinków między 6:00 a 10:00',
      icon: '🌅',
      criteria: 'early_bird_sessions:5',
      points: 15
    },
    {
      name: 'Seria Mistrzowska',
      description: 'Słuchaj 7 dni z rzędu',
      icon: '🔥',
      criteria: 'current_streak:7',
      points: 50
    },
    {
      name: 'Codzienny Słuchacz',
      description: 'Słuchaj 5 odcinków w jeden dzień',
      icon: '📅',
      criteria: 'daily_episodes_count:5',
      points: 25
    }
  ];

  for (const achievement of achievements) {
    // Sprawdź czy tabela ma nową strukturę (category, requirement_value, requirement_type)
    // czy starą (criteria)
    const tableInfo = await db.all("PRAGMA table_info(achievements)");
    const hasCriteria = tableInfo.some(col => col.name === 'criteria');
    
    if (hasCriteria) {
      // Stara struktura
      await db.run(`
        INSERT OR IGNORE INTO achievements 
        (name, description, icon, criteria, points)
        VALUES (?, ?, ?, ?, ?)
      `, [achievement.name, achievement.description, 
          achievement.icon, achievement.criteria, achievement.points]);
    } else {
      // Nowa struktura - mapuj criteria na requirement_type i requirement_value
      const [reqType, reqValue] = achievement.criteria.split(':');
      await db.run(`
        INSERT OR IGNORE INTO achievements 
        (name, description, category, icon, requirement_value, requirement_type, points)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [achievement.name, achievement.description, 'general', 
          achievement.icon, parseInt(reqValue) || 0, reqType, achievement.points]);
    }
  }
  
  console.log('✅ Zainicjalizowano system osiągnięć');
};

// Inicjalizacja statystyk użytkownika
const initializeUserStats = async (userId) => {
  const db = await getDb();
  await db.run(`
    INSERT OR IGNORE INTO user_stats (user_id)
    VALUES (?)
  `, [userId]);
};

// Eksport funkcji do obsługi bazy danych
export default getDb;