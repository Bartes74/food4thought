// Utility functions for working with the test database
import sqlite3 from 'sqlite3';

// Simple database initialization function
function getTestDb(callback) {
  const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
      console.error('Error creating in-memory database:', err);
      return callback(err);
    }
    
    // Enable foreign keys
    getDb().serialize(() => {
      getDb().run('PRAGMA foreign_keys = ON');
      getDb().run('PRAGMA journal_mode = WAL');
      getDb().run('PRAGMA busy_timeout = 5000');
      
      // Create basic tables for testing
      const schema = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          email_verified BOOLEAN DEFAULT 1
        );
        
        CREATE TABLE IF NOT EXISTS series (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          active BOOLEAN DEFAULT 1
        );
        
        CREATE TABLE IF NOT EXISTS episodes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          series_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          filename TEXT NOT NULL,
          additional_info TEXT DEFAULT '',
          FOREIGN KEY (series_id) REFERENCES series(id)
        );
        
        CREATE TABLE IF NOT EXISTS listening_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          episode_id INTEGER NOT NULL,
          duration_seconds INTEGER NOT NULL,
          start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (episode_id) REFERENCES episodes(id)
        );
      `;
      
      getDb().exec(schema, (err) => {
        if (err) {
          console.error('Error creating database schema:', err);
          return callback(err);
        }
        callback(null, db);
      });
    });
  });
}

export function withDb(callback) {
  return new Promise((resolve, reject) => {
    getTestDb((err, db) => {
      if (err) return reject(err);
      
      // Call the callback with the database connection
      Promise.resolve(callback(db))
        .then(result => {
          // Close the database connection
          getDb().close(err => {
            if (err) console.error('Error closing database:', err);
            resolve(result);
          });
        })
        .catch(error => {
          // Close the database connection on error
          getDb().close(err => {
            if (err) console.error('Error closing database:', err);
            reject(error);
          });
        });
    });
  });
}

export function queryDb(sql, params = []) {
  return withDb(db => {
    return new Promise((resolve, reject) => {
      getDb().all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  });
}

export function insertTestUser(userData = {}) {
  const { 
    email = 'test@example.com',
    password = 'test123',
    role = 'user',
    email_verified = 1 
  } = userData;
  
  return withDb(db => {
    return new Promise((resolve, reject) => {
      getDb().run(
        'INSERT INTO users (email, password_hash, role, email_verified) VALUES (?, ?, ?, ?)',
        [email, password, role, email_verified],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  });
}

export function clearTestData() {
  return withDb(db => {
    return new Promise((resolve, reject) => {
      // Delete all data from all tables (in the correct order to respect foreign keys)
      const tables = [
        'listening_sessions',
        'episodes',
        'series',
        'users'
      ];
      
      const deletePromises = tables.map(table => {
        return new Promise((res, rej) => {
          getDb().run(`DELETE FROM ${table}`, (err) => {
            if (err && !err.message.includes('no such table')) {
              return rej(err);
            }
            res();
          });
        });
      });
      
      Promise.all(deletePromises)
        .then(() => resolve())
        .catch(reject);
    });
  });
}

