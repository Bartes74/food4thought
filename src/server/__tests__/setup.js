import request from 'supertest';
import app from './test-app.js';
import db from '../database.js';

// Globalne zmienne dla testów
let adminToken = null;
let userToken = null;
let testUserId = null;
let testEpisodeId = null;
let testSeriesId = null;

// Funkcja do czyszczenia bazy danych przed testami
export const cleanupDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Usuń dane testowe (zachowaj podstawowe dane)
      db.run('DELETE FROM user_achievements WHERE user_id > 1');
      db.run('DELETE FROM user_favorites WHERE user_id > 1');
      db.run('DELETE FROM user_progress WHERE user_id > 1');
      db.run('DELETE FROM ratings WHERE user_id > 1');
      db.run('DELETE FROM listening_sessions WHERE user_id > 1');
      db.run('DELETE FROM user_stats WHERE user_id > 1');
      db.run('DELETE FROM users WHERE id > 1');
      
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

// Funkcja do logowania administratora
export const loginAdmin = async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@food4thought.local',
      password: 'admin123'
    });
  
  if (response.status === 200) {
    adminToken = response.body.token;
    return adminToken;
  }
  throw new Error('Nie udało się zalogować administratora');
};

// Funkcja do tworzenia testowego użytkownika
export const createTestUser = async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email: 'test@example.com',
      password: 'test123',
      role: 'user'
    });
  
  if (response.status === 201) {
    testUserId = response.body.user.id;
    return testUserId;
  }
  throw new Error('Nie udało się utworzyć testowego użytkownika');
};

// Funkcja do logowania testowego użytkownika
export const loginTestUser = async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'test123'
    });
  
  if (response.status === 200) {
    userToken = response.body.token;
    return userToken;
  }
  throw new Error('Nie udało się zalogować testowego użytkownika');
};

// Funkcja do tworzenia testowej serii
export const createTestSeries = async () => {
  const response = await request(app)
    .post('/api/series')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('name', 'Test Series')
    .field('description', 'Test series description')
    .field('color', '#ff0000');
  
  if (response.status === 201) {
    testSeriesId = response.body.series.id;
    return testSeriesId;
  }
  throw new Error('Nie udało się utworzyć testowej serii');
};

// Funkcja do tworzenia testowego odcinka
export const createTestEpisode = async () => {
  const response = await request(app)
    .post('/api/episodes')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('title', 'Test Episode')
    .field('series_id', testSeriesId)
    .field('additional_info', 'Test episode info');
  
  if (response.status === 201) {
    testEpisodeId = response.body.episode.id;
    return testEpisodeId;
  }
  throw new Error('Nie udało się utworzyć testowego odcinka');
};

// Funkcja do inicjalizacji testów
export const setupTests = async () => {
  await cleanupDatabase();
  await loginAdmin();
  await createTestUser();
  await loginTestUser();
  await createTestSeries();
  await createTestEpisode();
};

// Funkcja do czyszczenia po testach
export const teardownTests = async () => {
  await cleanupDatabase();
};

// Eksport zmiennych globalnych
export const getTestData = () => ({
  adminToken,
  userToken,
  testUserId,
  testEpisodeId,
  testSeriesId
});

export default {
  setupTests,
  teardownTests,
  getTestData,
  cleanupDatabase,
  loginAdmin,
  createTestUser,
  loginTestUser,
  createTestSeries,
  createTestEpisode
}; 