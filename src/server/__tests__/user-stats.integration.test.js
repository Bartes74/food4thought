import request from 'supertest';
import app from './test-app.js';
import { setupTests, teardownTests, getTestData } from './setup.js';

describe('User Stats Integration Tests', () => {
  beforeAll(async () => {
    await setupTests();
  });

  afterAll(async () => {
    await teardownTests();
  });

  describe('GET /api/users/:id/stats', () => {
    it('should return user statistics for authenticated user', async () => {
      const { userToken, testUserId } = getTestData();
      
      const response = await request(app)
        .get(`/api/users/${testUserId}/stats`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('completedCount');
      expect(response.body).toHaveProperty('inProgressCount');
      expect(response.body).toHaveProperty('favoritesCount');
      expect(response.body).toHaveProperty('totalListeningTime');
      expect(typeof response.body.completedCount).toBe('number');
      expect(typeof response.body.inProgressCount).toBe('number');
      expect(typeof response.body.favoritesCount).toBe('number');
      expect(typeof response.body.totalListeningTime).toBe('number');
    });

    it('should return 401 for unauthenticated request', async () => {
      const { testUserId } = getTestData();
      
      const response = await request(app)
        .get(`/api/users/${testUserId}/stats`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for accessing other user stats', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .get('/api/users/999/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/users/series-stats', () => {
    it('should return series statistics for authenticated user', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .get('/api/users/series-stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const series = response.body[0];
        expect(series).toHaveProperty('id');
        expect(series).toHaveProperty('name');
        expect(series).toHaveProperty('color');
        expect(series).toHaveProperty('totalCount');
        expect(series).toHaveProperty('completedCount');
        expect(series).toHaveProperty('totalTime');
        expect(typeof series.totalCount).toBe('number');
        expect(typeof series.completedCount).toBe('number');
        expect(typeof series.totalTime).toBe('number');
      }
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/users/series-stats');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/users/:id/favorites', () => {
    it('should return user favorites for authenticated user', async () => {
      const { userToken, testUserId } = getTestData();
      
      const response = await request(app)
        .get(`/api/users/${testUserId}/favorites`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 for unauthenticated request', async () => {
      const { testUserId } = getTestData();
      
      const response = await request(app)
        .get(`/api/users/${testUserId}/favorites`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for accessing other user favorites', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .get('/api/users/999/favorites')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/users/preferences', () => {
    it('should update user preferences successfully', async () => {
      const { userToken } = getTestData();
      
      const preferences = {
        activeSeries: [1, 2],
        language: 'polski',
        autoplay: true
      };
      
      const response = await request(app)
        .put('/api/users/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send(preferences);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid preferences', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .put('/api/users/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ invalidField: 'value' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .put('/api/users/preferences')
        .send({ activeSeries: [1] });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/achievements', () => {
    it('should return user achievements for authenticated user', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .get('/api/achievements')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('achievements');
      expect(response.body).toHaveProperty('stats');
      expect(Array.isArray(response.body.achievements)).toBe(true);
      expect(typeof response.body.stats).toBe('object');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/achievements');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/achievements/check', () => {
    it('should check and award achievements for authenticated user', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .post('/api/achievements/check')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('newAchievements');
      expect(Array.isArray(response.body.newAchievements)).toBe(true);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/achievements/check');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/users/:id/history', () => {
    it('should return user listening history for authenticated user', async () => {
      const { userToken, testUserId } = getTestData();
      
      const response = await request(app)
        .get(`/api/users/${testUserId}/history`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 for unauthenticated request', async () => {
      const { testUserId } = getTestData();
      
      const response = await request(app)
        .get(`/api/users/${testUserId}/history`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for accessing other user history', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .get('/api/users/999/history')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/users/:id/patterns', () => {
    it('should return user listening patterns for authenticated user', async () => {
      const { userToken, testUserId } = getTestData();
      
      const response = await request(app)
        .get(`/api/users/${testUserId}/patterns`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hourlyActivity');
      expect(response.body).toHaveProperty('dailyActivity');
      expect(response.body).toHaveProperty('weeklyActivity');
      expect(Array.isArray(response.body.hourlyActivity)).toBe(true);
      expect(Array.isArray(response.body.dailyActivity)).toBe(true);
      expect(Array.isArray(response.body.weeklyActivity)).toBe(true);
    });

    it('should return 401 for unauthenticated request', async () => {
      const { testUserId } = getTestData();
      
      const response = await request(app)
        .get(`/api/users/${testUserId}/patterns`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for accessing other user patterns', async () => {
      const { userToken } = getTestData();
      
      const response = await request(app)
        .get('/api/users/999/patterns')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 